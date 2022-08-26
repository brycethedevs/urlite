const lowdb = require("lowdb");
const fs = require("lowdb/adapters/FileSync");
const adapter = new fs("db.json");
const db = lowdb(adapter);
const body = require("body-parser").json();
const express = require("express");
const app = express();
const helmet = require("helmet")
app.use(helmet());
app.use(helmet.contentSecurityPolicy());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
const http = require('http');
const https = require('https');
const fs = require('fs');
const httpPort = 3000;
const httpsPort = 3001;

var key = fs.readFileSync(__dirname + '/certsFiles/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/certsFiles/selfsigned.crt');

var credentials = {
  key: key,
  cert: cert
};
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);


httpServer.listen(httpPort, () => {
  console.log("Http server listing on port : " + httpPort)
});

httpsServer.listen(httpsPort, () => {
  console.log("Https server listing on port : " + httpsPort)
});
app.use(express.static("public"));

app.set("json spaces", 2);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/stats", (req, res) => {
  res.sendFile(__dirname + "/views/stats.html");
});


app.get("/delete", (req, res) => {
  res.sendFile(__dirname + "/views/delete.html");
});


app.post("/create", body, (req, res) => {
  var url = req.body.url;
  var slug = req.body.slug;
  if (!url)
    return res
      .status(400)
      .json({ success: false, error: "No URL was provided." });

  if (checkurl(url) === false)
    return res
      .status(400)
      .json({ success: false, error: "The URL provided is invalid" });

  if (url.includes(req.get("host")))
    return res.status(400).json({
      success: false,
      error: "Long URLs cannot point to the URL shortener domain."
    });


  const token = random(30);

  if (slug) {

    if (!slug.match(/^[A-Za-z0-9_-]+$/))
      return res.status(400).json({
        success: false,
        error: "Slug may only contain letters, numbers, dashes and underscores."
      });


    if (
      db
        .get("urls")
        .find({ slug: slug })
        .value()
    )
      return res.status(400).json({
        success: false,
        error: "The requested slug is already in use."
      });


    db.get("urls")
      .push({ slug: slug, url: url, token: token, stats: 0 })
      .write();
    

    return res
      .status(200)
      .json({ success: true, slug: slug, url: url, token: token });

  } else {

    var slug = random(5);

    while (
      db
        .get("urls")
        .find({ slug: slug })
        .value()
    ) {
      slug = random(5);
    }


    db.get("urls")
      .push({ slug: slug, url: url, token: token, stats: 0 })
      .write();

    return res
      .status(200)
      .json({ success: true, slug: slug, url: url, token: token });
  }
});

app.post("/stats", body, (req, res) => {
  var slug = req.body.slug;

  if (!slug)
    return res.status(400).json({ success: false, error: "Slug is missing." });


  const result = db
    .get("urls")
    .find({ slug: slug })
    .value();


  if (!result)
    return res.status(400).json({ success: false, error: "Invalid slug." });

  return res.status(200).json({
    success: true,
    slug: result.slug,
    url: result.url,
    stats: result.stats
  });
});


app.post("/delete", body, (req, res) => {
  var token = req.body.token;
  var slug = req.body.slug;


  if (!slug || !token)
    return res
      .status(400)
      .json({ success: false, error: "Slug or token is missing." });


  const result = db
    .get("urls")
    .find({ slug: slug, token: token })
    .value();


  if (!result)
    return res
      .status(400)
      .json({ success: false, error: "Invalid slug or token." });


  db.get("urls")
    .remove({ slug: slug, token: token })
    .write();


  return res.status(200).json({ success: true });
});


app.get("*", (req, res) => {

  const slug = req.path.slice(1);

  const result = db
    .get("urls")
    .find({ slug: slug })
    .value();


  if (!result) return res.status(404).sendFile(__dirname + "/views/404.html");


  db.get("urls")
    .find({ slug: slug })
    .assign({ stats: result.stats + 1 })
    .write();


  return res.redirect(result.url);
});


function checkurl(string) {
  var url = "";
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}


function random(length) {
  var result = "";
  const characters = "abcdefghijkmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}


db.defaults({
  urls: []
}).write();
