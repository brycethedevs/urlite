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
app.use(express.static("public"));

app.set("json spaces", 2);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
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
      .push({ slug: slug, url: url})
      .write();
    

    return res
      .status(200)
      .json({ success: true, slug: slug, url: url});

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
    .assign({ stats: result.stats + 1 })
    .write();


  return res.redirect(result.url);
});

const listener = app.listen(80, () => {
  console.log("Your app is listening on port " + listener.address().port);
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
