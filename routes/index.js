var express = require("express");
var spotifyContent = require("../SpotifyContent/SpotifyContent");
var router = express.Router();

/* GET home page */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "CDfy - Login",
  });
});

router.get("/login", function (req, res) {
  spotifyContent.spotifyLogin(res);
});

router.get("/callback", function (req, res) {
  spotifyContent.spotifyCallback(req, res);
});

router.get("/CDfy", function (req, res, next) {
  res.render("record", {
    title: "CDfy",
    key: req.session.key,
    density: req.session.density,
    user: req.session.user,
    rec: req.session.rec,
  });
});

module.exports = router;
