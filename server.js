const lowdb = require("lowdb");
const fs = require("lowdb/adapters/FileSync");
const adapter = new fs("db.json");
const db = lowdb(adapter);
const body = require("body-parser").json();
const express = require("express");
const app = express();
const realFs = require('node:fs');
const https = require('https')
const helmet = require("helmet")
const server = https.createServer(options, app);

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
app.use(express.static("public"));

const io = require('@pm2/io')

const realtimeUser = io.metric({
  name: 'Realtime user',
})

const key = realFs.readFileSync(__dirname + '/privatekey.pem');
const cert = realFs.readFileSync(__dirname + '/cert.pem');
const options = {
  key: key,
  cert: cert
};

app.set("json spaces", 2);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/create", body, (req, res) => {
  let url = req.body.url;
  let slug = req.body.slug;
  if (!url)
    return res
      .status(400)
      .json({ success: false, error: "No URL was provided." });

  if (checkurl(url) === false)
    return res
      .status(400)
      .json({ success: false, error: "The URL provided is invalid" });

  
 
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
        error: "The requeste})d slug is already in use."
      });


    db.get("urls")
      .push({ slug: slug, url: url})
      .write();
    

    return res
      .status(200)
      .json({ success: true, slug: slug, url: url});

  } else {

    let slug = random(5);

    while (
      db
        .get("urls")
        .find({ slug: slug })
        .value()
    ) {
      slug = random(5);
    }


    db.get("urls")
      .push({ slug: slug, url: url })
      .write();

    return res
      .status(200)
      .json({ success: true, slug: slug, url: url });
  }
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
    .assign({})
    .write();


  return res.redirect(result.url);
});

server.listen(3000);

function checkurl(string) {
  let url = "";
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

//* Math.random()
function random(length) {
  let result = "";
  const characters = "abcdefghijkmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(crypto.getRandomValues(). * characters.length));
  }
  return result;
}

db.defaults({
  urls: []
}).write();
