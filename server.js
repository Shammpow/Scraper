var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");
var db = require("./models");

var PORT = 3000;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/", function (req, res) {
  res.render("newsinfo")
  request("https://www.reddit.com/r/news/top/", function (error, response, html) {
    var $ = cheerio.load(html);

    $("p.title").each(function (i, element) {
      var results = [];

      var title = $(element).text();
      var link = $(element).children().attr("href");
      results.push({
        title: title,
        link: link
      });

      db.Article.create(results)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          return res.json(err);
        });
    });
  });
});

app.get("/articles", function (req, res) {
  db.Article.find({})
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    })
});

app.get("/articles/:id", function (req, res) {
  db.Article.findOne({
    _id: (req.params.id)
  })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle)
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({
        _id: (req.params.id)
      }, { $set: { note: dbNote._id } }, { new: true });
    })
    .then(function (dbUser) {
      res.json(dbUser);
    })
    .catch(function (err) {
      res.json(err);
    })
});

app.delete("articles/:id", function (req, res) {
  db.Note.deleteOne({
    _id: (req.params.id)})
  .then(function(data) {
    res.json(data)
    .catch(function(err) {
      res.json(err);
    })
  })
})

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});