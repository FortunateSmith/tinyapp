const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
let cookieParser = require('cookie-parser');
const PORT = 8080;

const app = express();

app.set("view engine", "ejs");
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  "userRandomId": {
    id: "userRandomId",
    email: "example@fmail.com",
    password: "unicorn_f4arts"
  },
  "user2RandomId": {
    id: "user2RandomId",
    email: "example2@zmail.com",
    password: "12345"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const loggedInUserID = req.cookies["user_id"];
  const loggedInUser = users[loggedInUserID];
  
  const templateVars = {
    user: loggedInUser,
    urls: urlDatabase
  };
 
  console.log("vars: ", templateVars)
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  console.log("urls databse: ", urlDatabase);
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});
/////////////////////////////////////////////////////////
// to generate short sequences to be used as short urls
const generateRandomString = function() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const length = 6;

  for (let c = 0; c < length; c++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
/////////////////////////////////////////////////
// redirects to longURL when user initiates shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log({shortURL});
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// Registration
app.post("/register", (req, res) => {
  let id = generateRandomString();
  let user = {
    email: req.body.email,
    password: req.body.password,
    id: id
  };

  if (req.body.password.length === 0 || req.body.email.length === 0) {
    return res.status(400).send("ERROR 400: Email and/or Password field empty");
  }
  const usersEmail = Object.values(users);
  const findEmail = usersEmail.find(userEmail => {
    return userEmail.email === req.body.email;
  });
  console.log(findEmail);

  if (findEmail) {
    return res.status(400).send('User account already exists for this email');
  }
  users[id] = user;
  res.cookie("user_id", id);
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const user = req.body.user;
  res.cookie("user_id", user);
  res.redirect(`/urls`);
});
// assigns new longURL to previously created shortURL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});
// shortURL generator
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// deletes shortURL: longURL key/value pair from database
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(`/urls`);
});
