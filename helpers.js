const { users, urlDatabase } = require("./datafiles");

const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

const generateRandomString = function() {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const length = 6;

  for (let c = 0; c < length; c++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// verify if urls belong to logged in user
const urlsForUser = function(id) {
  const userURLs = {};
  for (const urls in urlDatabase) {
    if (id === urlDatabase[urls].id) {
      userURLs[urls] = urlDatabase[urls];
    }
  }
  return userURLs;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };