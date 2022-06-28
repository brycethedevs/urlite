const app = express();
const lowdb = require("lowdb");
const fs = require("lowdb/adapters/FileSync");
const adapter = new fs("db.json");
const db = lowdb(adapter);
const body = require("body-parser").json();
const express = require("express");



app.use(express.static("public"));

app.set("json spaces", 2);


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});



app.post("/api/create", body, (req, res) => {

  var url = req.body.url;
  var slug = req.body.slug;


  if (!url)
    return res
      .status(400)
      .json({ success: false, error: "No URL was provided." });



  if (url.includes(req.get("host")))
    return res.status(400).json({
      success: false,
      error: "Long URLs cannot point to the URL shortener domain."
    });

  


  if (slug) {
    if (!slug.match(/^[A-Za-z0-9_-]+$/))
      return res.status(400).json({
        success: false,
        error: "The custom URL may only contain letters, numbers, dashes and underscores."
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
      .push({ slug: slug, url: url })
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


const listener = app.listen(8080, () => {
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
