const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const { users, urlDatabase } = require("./datafiles");

const morgan = require("morgan");
const cookieSession = require("cookie-session");
const { getUserByEmail, generateRandomString, urlsForUser } = require("./helpers");

const PORT = 8080;
const app = express();

app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["asdf"],
  maxAge: 24 * 60 * 60 * 1000
}));

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
  const loggedInUserID = req.session.user_id;
  if (!loggedInUserID) {
    res.redirect("/login");
  }
  const loggedInUser = users[loggedInUserID];
  const userURLs = urlsForUser(loggedInUserID);
  const templateVars = {
    user: loggedInUser,
    urls: userURLs,
  };
  res.render("urls_index", templateVars);
});


app.get("/register", (req, res) => {
  const templateVars = {
    user: req.session.user_id,
  };
  res.render("register", templateVars);
});


app.get("/login", (req, res) => {
  const templateVars = {
    user: req.session.user_id,
  };
  res.render("login", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/register");
  }
  const user = users[userID];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});


// Page redirected to from /urls/new and from edit button on /urls
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/register");
  }
  const user = users[userID];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user,
  };
  res.render("urls_show", templateVars);
});


// GET: redirects to longURL when client uses shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});


// POST: Registration
app.post("/register", (req, res) => {
  let { email, password } = req.body;
  if (!password.length || !email.length) {
    return res.status(400).send("ERROR 400: Email and/or Password field empty");
  }

  const findEmailInUsers = getUserByEmail(email, users);
  if (findEmailInUsers) {
    return res
      .status(400)
      .send("ERROR 400: User account already exists for this email");
  }

  const id = generateRandomString();
  password = req.body.password;
  const hashedPswd = bcrypt.hashSync(password, 10);
  
  const user = {
    email: req.body.email,
    password: hashedPswd,
    id: id,
  };
  // adds a key of [id] (generated random string) to users object with value of user (app.post at register)
  // console.log("newly hashed pswd: ", user.password);
  users[id] = user;
  req.session.user_id = id;
  res.redirect(`/urls`);
});


// POST: login
app.post("/login", (req, res) => {
  // const email = req.body.email && const password = req.body.password
  const { email, password } = req.body;
  if (!password.length || !email.length) {
    return res.status(403).send("ERROR 403: Email and/or Password field empty");
  }

  const validUser = getUserByEmail(email, users);
  if (!validUser) {
    return res.status(403).send("ERROR 403: User does not exist");
  }

  if (bcrypt.compareSync(password, validUser.password)) {
    // console.log("Password matches");
  } else {
    return res.status(403).send("Password Invalid");
  }

  req.session.user_id = validUser.id;
  res.redirect(`/urls`);
});


// assigns new longURL to previously created shortURL
app.post("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  const shortURL = req.params.id;

  if (!user) {
    res.redirect("/login");
  }

  if (user !== urlDatabase[shortURL].id) {
    res.redirect("/urls");
  }

  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});


// POST: shortURL generator
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    id: req.session.user_id,
  };
  // console.log("POST /urls: ", urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});


// POST: deletes shortURL: longURL key/value pair from database
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!user) {
    res.redirect("/login");
  }

  if (user !== urlDatabase[shortURL].id) {
    res.redirect("/urls");
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// POST: logout
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect(`/login`);
});

app.listen(PORT, () => {
  // console.log(`Example app listening on port: ${PORT}`);
});
