var SpotifyWebApi = require("spotify-web-api-node");
var querystring = require("querystring");

var client_id = "0ff0285331ad42b099464ec95f1075cb"; // Your client id
var client_secret = "43181c8738ad4022ab27bfa1e6bc7693"; // Your secret
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
          artistsIDs = [];

          data.body.items.forEach(function (item) {
            songIDs.push(item.track.id);
            artistsIDs.push(item.track.artists[0].id);
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
            data.body.audio_features.forEach(function (f) {
              key.push(f.key);
            });

            var _key = getMax(occurrences(key));
            req.session.key = _key;

            spotifyApi
              .getRecommendations({
                limit: 1,
                seed_tracks: getRandomItems(songIDs, 3),
                seed_artists: getRandomItems(artistsIDs, 2),
              })
              .then(function (data) {
                req.session.rec = data.body.tracks[0];

                res.redirect("/CDfy");
              });
          });
        });
      req.session.user =
        data.body.id.length > 10 ? data.body.display_name : data.body.id;
    });
};

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

function getRandomItems(arr, n) {
  var values = [];
  for (let i = 0; i < n; i++) {
    item = arr[getRandomInt(0, arr.length)];
    // console.log(item);
    values.push(item);
  }
  return values;
}
