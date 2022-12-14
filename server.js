const lowdb = require("lowdb");
const fs = require("lowdb/adapters/FileSync");
const adapter = new fs("db.json");
const db = lowdb(adapter);
const body = require("body-parser").json();
const express = require("express");
const app = express();


app.use(express.static("public"));

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


 
    app.use((err, req, res, next) => {
      res.send(`<!DOCTYPE html>
      <html lang="en">
        <head>
        <meta charset="UTF-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
       <link rel="icon" type="image/png" href="./urlite.webp"/>
       <meta name="title" content="Googlie ">
      <meta name="description" content="URL shortener that fast and very simple just one click of a button and you will have your URL forever. What are you waiting for come shorten your URL now!     ">
      <meta name="keywords" content="URL shortener,URL,shortener,fast URL shortener,ad free,Googlie,Nerver sell your data">
      <meta name="robots" content="index, follow">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="language" content="English">
      <style>
      body, html {
        height: 95%;
      }
      
      body {
        background: #1C1F29;
        text-align: center;
        font-family: "Nunito", sans-serif;
        color: white;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      nav {
        width: 100%;
      }
      
      nav h1 {
        color: #32DAF5;
        font-weight: 900;
        font-size: 3rem;
        margin-left: 20px;
      }
      
      #urltoshorten {
        background: #2C333D;
        color: white;
        padding: 20px 30px;
        box-shadow: 0px 9px 15px 0 rgba(0, 0, 0, 0.2);
        border-radius: 10rem;
        width: 65vw;
        border: 1px solid transparent;
        transition: .3s;
      }
      
      form {
        display: flex;
        flex-direction: row;
        text-align: center;
        margin-top: 20px;
        margin-bottom: 20px;
      }
      
      #urltoshorten:focus {
        border: 1px solid rgba(50, 218, 345, .5);
      }
      
      input {
        border: none;
      }
      
      input:focus {
        /* removing the input focus blue box. Put this on the form if you like. */
        outline: none;
      }
      
      button {
        background: #32DAF5;
        color: white;
        border: none;
        transform: scale(0.9);
        margin-left: -55px;
        cursor: pointer;
        width: 4.5em;
        border-radius: 10rem;
        box-shadow: 0 1px 3px 0 #32DAF5, 0 6px 20px 0 rgba(0, 0, 0, 0.19);
      }
      
      .center {
        display: flex;
        justify-content: center; /* center horizontally */
        align-items: center; /* center vertically */
      }
      
      #vanityflex {
          display: flex;
        flex-direction: row;
        text-align: center;
      }
      
      #vanity {
        background: #2C333D;
        color: white;
        padding: 20px 30px;
        box-shadow: 0px 9px 15px 0 rgba(0, 0, 0, 0.2);
        margin-left:1vw;
        height: 1em;
        border-radius: 10rem;
        border: 1px solid transparent;
        transition: .3s;
      }
      
      #buttons {
        background: #2C333D;
        color: white;
        padding: 20px 30px;
        box-shadow: 0px 9px 15px 0 rgba(0, 0, 0, 0.2);
        border-radius: 10rem;
        width: 12vw;
        display: block;
        border: 1px solid transparent;
        transition: .3s;
      }
      
      #vanity:focus {
        border: 1px solid rgba(50, 218, 345, .5);
      }
      </style>
          <title>Urlite | 404</title>
        </head>
        <body>
            <h1>404</h1>
            <h4>That URL does not exist.</h4>
        </body>
      </html>
      `)
    })


  db.get("urls")
    .find({ slug: slug })
    .assign({})
    .write();


  return res.redirect(result.url);
});

app.listen(31802)


function checkurl(string) {
  let url = "";
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}


function random(length) {
  let result = "";
  const characters = "abcdefghijkmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));

  }
  return result;
}

db.defaults({
  urls: []
}).write();
