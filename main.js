import express from "express";
import { readFileSync, readdirSync } from "fs";
import yaml from "js-yaml";
import path from "path";
import sqlite3 from 'sqlite3';
import fs from 'fs';
const app = express();
const port = 3010;

const games = ["brackeys11"]

// Set the view engine to pug
app.set("view engine", "pug");

app.set("views", path.join(process.cwd(), "views"));
app.use(express.static(path.join(process.cwd(), 'public')));

// Content
const bookmarkFiles = readdirSync(path.join(process.cwd(), "content/bookmarks"));

const bookmarks = bookmarkFiles.map(file => {
  const content = readFileSync(`./content/bookmarks/${file}`, 'utf8');
  return yaml.load(content);
}).sort((a, b) => a.date > b.date ? -1 : 1);

const socialFiles = readdirSync(path.join(process.cwd(), "content/socials"));

const socials = socialFiles.map(file => {
  const content = readFileSync(`./content/socials/${file}`, 'utf8');
  return yaml.load(content);
}).sort((a, b) => a.date > b.date ? -1 : 1);

const queueFiles = readdirSync(path.join(process.cwd(), "content/queue"));

function textToNum(text) {
  switch(text) {
    case "Critical":
      return 4;
    case "High":
      return 3;
    case "Medium":
      return 2;
    case "Low":
      return 1;
    case "Giant":
      return 5;
    case "Large":
      return 4;
    case "Regular":
      return 3;
    case "Small":
      return 2;
    case "Tiny":
      return 1;
    default:
      return 0;
  }
}

const queue = queueFiles.map(file => {
  const content = readFileSync(`./content/queue/${file}`, 'utf8');
  return yaml.load(content);
}).sort((a, b) => {
  const prorityA = textToNum(a.priority);
  const prorityB = textToNum(b.priority);

  if (prorityA === prorityB) {
    const sizeA = textToNum(a.size);
    const sizeB = textToNum(b.size);

    return sizeA < sizeB ? -1 : 1;
  }

  return prorityA > prorityB ? -1 : 1;
});

// Routes

app.get("/", function (req, res) {
  res.render("pages/index", { path: req.path });
});

app.get("/about", function (req, res) {
  res.render("pages/about", { path: req.path });
});

app.get("/blog", function (req, res) {
  res.render("pages/blog", { path: req.path });
});

app.get("/bookmarks", function (req, res) {
  res.render("pages/bookmarks", { options: bookmarks, type: "bookmarks" });
});

app.get("/bookmarks/:slug", function (req, res) {
  const bookmark = bookmarks.find(bookmark => bookmark.slug === req.params.slug);
  res.render("pages/bookmark", { options: bookmarks, type: "bookmarks", bookmark });
});

app.get("/socials", function (req, res) {
  res.render("pages/socials", { options: socials, type: "socials" });
});

app.get("/queue", function (req, res) {
  res.render("pages/queue", { options: queue, type: "queue" });
});

app.listen(port, function () {
  console.log(`App is listening on port ${port}`);
});

// sqlite
const dir = './leaderboards';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

for (const game of games) {
  const db = new sqlite3.Database(`${dir}/${game}.sqlite3`, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`Connected to the ${game}.sqlite3 database.`);

    db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, score INTEGER)', (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log(`Created ${game} scores table`);
    });
  });
}

// Leaderboard Routes
app.get('/api/v1/leaderboard', (req, res) => {
  const game = req.query.game;

  if (!games.includes(game)) {
    return res.status(404).json({ message: 'Game not found' });
  }

  const db = new sqlite3.Database(`${dir}/${game}.sqlite3`, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`Connected to the ${game}.sqlite3 database.`);

    db.all('SELECT * FROM scores ORDER BY score DESC', (err, rows) => {
      if (err) {
        console.error(err.message);
      }
      res.json(rows);
    });
  });
});

app.post('/api/v1/leaderboard', express.json(), (req, res) => {
  const game = req.body.game;
  const score = req.body.score;

  console.log(req.query)

  if (!games.includes(game)) {
    return res.status(404).json({ message: 'Game not found' });
  }

  if (!score) {
    return res.status(400).json({ message: 'Score is required' });
  }

  const db = new sqlite3.Database(`${dir}/${game}.sqlite3`, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log(`Connected to the ${game}.sqlite3 database.`);

    db.run('INSERT INTO scores (score) VALUES (?)', score, (err) => {
      if (err) {
        console.error(err.message);
      }
      res.json({ message: 'Score added' });
    });
  });
});