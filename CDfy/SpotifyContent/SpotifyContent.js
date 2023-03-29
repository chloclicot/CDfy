var SpotifyWebApi = require("spotify-web-api-node");
var querystring = require("querystring");

var client_id = ""; // Your client id
var client_secret = ""; // Your secret
var redirect_uri = "http://localhost:8888/callback";
var stateKey = "spotify_auth_state";

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Login with Spotify
module.exports.spotifyLogin = function (res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = "user-read-email user-read-recently-played";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
};

var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri,
});

// callback to get the data needed

module.exports.spotifyCallback = function (req, res) {
  spotifyApi
    .authorizationCodeGrant(req.query.code)
    .then(function (data) {
      spotifyApi.setAccessToken(data.body.access_token);
      spotifyApi.setRefreshToken(data.body.refresh_token);
      return spotifyApi.getMe();
    })
    .then(function (data) {
      spotifyApi
        .getMyRecentlyPlayedTracks({
          limit: 50,
        })
        .then(function (data) {
          songIDs = [];
          data.body.items.forEach(function (item) {
            songIDs.push(item.track.id);
          });
          //calculating the time difference

          var dateF = Date.parse(data.body.items[0].played_at);
          var dateI = Date.parse(
            data.body.items[data.body.items.length - 1].played_at
          );
          var activity = (dateF - dateI) / 1000 / 60 / 60; // convert milliseconds to hours

          var density = 0;
          if (activity < 10) density = getRandomInt(131, 201);
          else if (activity < 20) density = getRandomInt(101, 131);
          else if (activity < 35) density = getRandomInt(51, 101);
          else if (activity > 35) density = getRandomInt(21, 51);

          req.session.density = density;

          spotifyApi.getAudioFeaturesForTracks(songIDs).then(function (data) {
            var key = [];

            data.body.audio_features.forEach(function (p1, p2, p3) {
              key.push(p1.key);
            });
            var _key = getMax(occurrences(key));
            req.session.key = _key;
            res.redirect("/myApp");
          });
        });
      req.session.user =
        data.body.id.length > 10 ? data.body.display_name : data.body.id;
    });
};

// module.exports.spotifyCallback = function (req, res) {
//   spotifyApi
//     .authorizationCodeGrant(req.query.code)
//     .then(
//       function (data) {
//         spotifyApi.setAccessToken(data.body["access_token"]);
//         spotifyApi.setRefreshToken(data.body["refresh_token"]);
//         return spotifyApi.getMe;
//       },
//       function (err) {
//         console.log("Something went wrong!", err);
//       }
//     )
//     .then(function (data) {
//       spotifyApi
//         .getMyRecentlyPlayedTracks({
//           limit: 50,
//         })
//         .then(function (data) {
//           // we will not need every info from  the response
//           var songs = [];
//           var dateF = Date.parse(data.body.items[0].played_at);
//           var dateI = Date.parse(
//             data.body.items[data.body.items.length - 1].played_at
//           );
//           var activity = (dateF - dateI) / 1000 / 60 / 60; // convert milliseconds to hours
//           data.body.items.forEach(function (item) {
//             songs.push(item.track.id); // we stock IDs to get the song rec later
//           });
//           var density = 0;
//           if (activity < 10) density = getRandomInt(131, 201);
//           else if (activity < 20) density = getRandomInt(101, 131);
//           else if (activity < 35) density = getRandomInt(51, 101);
//           else if (activity > 35) density = getRandomInt(21, 51);

//           req.session.density = density;

//           spotifyApi.getAudioFeaturesForTracks(songs).then(function (data) {
//             var keys = [];
//             data.body.audio_features.forEach(function (f) {
//               keys.push(f.key);
//             });
//             // var key = getMax(occurrences(keys));
//             // console.log("et la" + key);
//             // req.session.key = 3;
//           });
//           // req.session.key = 0;
//           req.session.key = 3;
//           res.redirect("/myApp");
//         });
//     });
// };

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function occurrences(arr) {
  var occ = new Array(12).fill(0);
  for (i = 0; i < arr.length; i++) {
    for (j = 0; j < arr.length; j++) {
      if (arr[j] == i) {
        occ[i] += 1;
      }
    }
  }
  return occ;
}

function getMax(arr) {
  var max = 0;
  arr.forEach(function (value) {
    if (value > max) {
      max = value;
    }
  });
  return max;
}
