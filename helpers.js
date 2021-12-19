const bcryptjs = require('bcryptjs');

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
}

const getUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {  
      return user;
    }
  }

};

const emailExists = (users, email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}

const urlsForUser = (urlDatabase, id) => {
  const userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].user_id === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
}

const getUserById = (id, users) => {
  const user = users[id];
  if (user) {
    return user;
  }
  return null;
}

const checkPassword = (email, password, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      if (bcryptjs.compareSync(password, users[user].password)) {
        return true;
      }
    }
  }
  return false;
}




module.exports = { generateRandomString, getUserByEmail, urlsForUser, emailExists, checkPassword, getUserById }