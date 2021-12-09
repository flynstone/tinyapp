const express = require("express");
const app = express();
const ejs = require('ejs');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { request } = require("express");

const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  "testUserId": {
    id: "testUserId",
    email: "user@test.com",
    password: "pass"
  }
}

// Generate a random string
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
}

// Search for a url with the email in "users" database
const emailExists = (users, email) => {
  for (const user in users) {
    if (users[user].email === email) return true;
  }
  return false;
}

const findByEmail = (email, db) => {
  for (let user in db) {
    if (db[user].email === email) {
      return db[user].id;
    }
  }
}

const checkPassword = (email, password, users) => {
  for (let user in users) {
    if (users[user].email === email && users[user].password === password) {
      return true;
    }
  }
  return false;
}

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// ------------------------------------------------------------ //
//                        App Port
// ------------------------------------------------------------ //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// ------------------------------------------------------------ //
//                      Default route
// ------------------------------------------------------------ //

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// ------------------------------------------------------------ //
//              GET => request for Index Route
// ------------------------------------------------------------ //

app.get("/urls", (req, res) => {
  const id = req.cookies.user_id;
  const user = id ? users[id] : null;
  const templateVars = {
    urls: urlDatabase,
    user
  }
  res.render("urls_index", templateVars);
});


// ------------------------------------------------------------ //
//                GET => request for New Url
// ------------------------------------------------------------ //

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id;
  const user = id ? users[id] : null;
  const templateVars = { user };
  if (user) {
    let templateVars = { user };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});


// ------------------------------------------------------------ //
//            GET => request for selected shortURL
// ------------------------------------------------------------ //

app.get("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const id = req.cookies.user_id;
  const user = id ? users[id] : null; // check if the cookie already exists with a legit id 
  let templateVars = { shortURL, longURL: urlDatabase[shortURL], user };
  res.render("urls_show", templateVars);
});

// ------------------------------------------------------------ //
//              GET => request for Register
// ------------------------------------------------------------ //

app.get("/register", (req, res) => {
  const id = req.cookies["user_id"];
  const user = id ? users[id] : null;
  const templateVars = {
    user
  }
  res.render("urls_register", templateVars);
});

// ------------------------------------------------------------ //
//              GET => request for Login
// ------------------------------------------------------------ //

app.get("/login", (req, res) => {
  const templateVars = {
    users,
    user: users[req.cookies.user_id]
  }
  res.render("urls_login", templateVars);
});


// ------------------------------------------------------------ //
//   GET => request redirecting to the corresponding longURL
// ------------------------------------------------------------ //

app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const longURL = urlDatabase[shortURL];
  if (!longURL) {
    res.status(302).send("Not found");
  } else {
    res.redirect(longURL);
  }
});

// ------------------------------------------------------------ //
//  POST => request creating shortURL random string + redirect
// ------------------------------------------------------------ //

app.post("/urls", (req, res) => {

  const shortURL = generateRandomString();

  // If user has not included http in the longURL, add it to the longURL
  if (!(req.body.longURL).includes('http')) {
    req.body.longURL = 'http://' + req.body.longURL;
  }
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// ------------------------------------------------------------ //
//     POST => request to delete a shortURL + redirect
// ------------------------------------------------------------ //

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.cookies.userId === urlDatabase[shortURL].userId) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/403");
  }
});


// ------------------------------------------------------------ //
//  POST => request to save the shortURL in the db + redirect
// ------------------------------------------------------------ //

app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = req.body;
  console.log(shortURL, longURL);
  if (!urlDatabase[shortURL]) {
    res.send("The shortURL doesn't exist");
  } else if (urlDatabase[shortURL]) {
    urlDatabase[shortURL] = longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

// ------------------------------------------------------------ //
//           POST => request to login + redirect
// ------------------------------------------------------------ //

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  const userId = findByEmail(userEmail, users);
  const checkPass = checkPassword(userEmail, userPass, users);

  if (userId && checkPass) {
    res.cookie('user_id', userId);
  } else {
    res.status(403).send("Invalid email or password combination.");
  }
  res.redirect("/urls");
});

// ------------------------------------------------------------ //
//           POST => request to logout + redirect
// ------------------------------------------------------------ //

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// ------------------------------------------------------------ //
//           POST => request to Register + redirect
// ------------------------------------------------------------ //

app.post("/register", (req, res) => {

  const { email, password } = req.body;
  if (email === "" || password === "") {
    res.status(400).send("Please include both a valid email and password");
    return;
  }
  else if (findByEmail(email, users)) {
    res.status(400).send("An account already exists for this email address");
  }
  else {
    const newUserId = generateRandomString();
    users[newUserId] = {
      id: newUserId,
      email: email,
      password: password
    };
    res.cookie('user_id', newUserId);
    res.redirect('/urls');
  }
});



