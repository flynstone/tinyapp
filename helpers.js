const bcryptjs = require('bcryptjs');

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
}

const getUserByEmail = (email, users) => {
  for (let userId in users) {
    const user = users[userId]; 
    if (user.email === email) {  
      return user;
    }
  }
  return undefined;
};

const emailExists = (email, password, users) => {
  if (!email || !password) { 
    return false;
  }

  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}

const urlsForUser = (id, urlDatabase) => {
  const userUrls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
}

const checkPassword = (email, password, users) => {
  const user = getUserByEmail(email, users);
  if (!email || !password) {
    return false;
  }

  for (let user in users) {
    if (users[user].email === email && bcryptjs.compareSync(password, users[user].hashedPassword)) {
      return users[user];
    }
  }

  return false;
}




module.exports = { generateRandomString, urlsForUser, emailExists, checkPassword }