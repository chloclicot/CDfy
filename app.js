var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var session = require("express-session");

var index = require("./routes/index");

var app = express();

app.use(
  session({
    cookie: {
      path: "/",
    },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser())
  .use("/", index);

app.set("view engine", "ejs");

console.log("Listening on 8888");
app.listen(8888);
