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

const authenticateUser = function(email, password, users) {
  for (const user in users) {
    if (users[user].email === email && users[user].password === password) {
      return users[user];
    }
  }
  return false;
};

const findEmail = function(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
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
  
  console.log("vars: ", templateVars);
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
  const userID = req.cookies["user_id"];
  if (!userID) {
    return res.redirect("/register");
  }
  const user = users[userID];
  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});
// Page redirected to from /urls/new and from edit button on /urls
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    return res.redirect("/register");
  }
  const user = users[userID];

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user
  };
  res.render("urls_show", templateVars);
});

// GET: redirects to longURL when user initiates shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log({shortURL});
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
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

// POST: Registration
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if (password.length === 0 || email.length === 0) {
    return res.status(400).send("ERROR 400: Email and/or Password field empty");
  }
  const findEmailInUsers = findEmail(email, users);
  if (findEmailInUsers) {
    return res.status(400).send('ERROR 400: User account already exists for this email');
  }
  
  let id = generateRandomString();
  let user = {
    email: req.body.email,
    password: req.body.password,
    id: id
  };
  // adds a key of [id] (generated random string) to users object with value of user (app.post at register)
  users[id] = user;
  
  res.cookie("user_id", id);
  res.redirect(`/urls`);
});

// POST: login
app.post("/login", (req, res) => {

  const {email, password} = req.body;
  if (password.length === 0 || email.length === 0) {
    return res.status(403).send("ERROR 403: Email and/or Password field empty");
  }
  
  const authUser = authenticateUser(email, password, users);
  if (!authUser) {
    return res.status(403).send("ERROR 403: Email doesn't exist");
  }
  
  const id = authUser.id;
  
  res.cookie("user_id", id);
  res.redirect(`/urls`);
});

// assigns new longURL to previously created shortURL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});

// POST: shortURL generator
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// POST: deletes shortURL: longURL key/value pair from database
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// POST: logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port: ${PORT}`);
});