const express = require("express");
const app = express();
const ejs = require('ejs');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcryptjs = require('bcryptjs');

const PORT = 8080; // default port 8080
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId:  "testUserId" },
    "9sm5xK": { longURL: "http://www.google.com", userId:  "testUserId" },
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

const checkPassword = (email, password, usersDb) => {
  for (let user in usersDb) {
    if (users[user].email === email && bcryptjs.compareSync(password, usersDb[user].password)) {
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
  let templateVars = {
    "urls": urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});


// ------------------------------------------------------------ //
//                GET => request for New Url
// ------------------------------------------------------------ //

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id;
  const user = id ? users[id] : null;
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
  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL],
    user
  };
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
  const longURL = urlDatabase[shortURL].longURL;
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
  const { longURL } = req.body;
  const shortURL = generateRandomString();

  const userId = req.cookies.user_id;
  urlDatabase[shortURL] = {
    longURL,
    userId,
  }
  res.redirect(`/urls/${shortURL}`);
});

// ------------------------------------------------------------ //
//     POST => request to delete a shortURL + redirect
// ------------------------------------------------------------ //

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  const userId = req.cookies.user_id;
  if (userId) {
    delete urlDatabase[shortURL];
  } else {
    res.send("Unauthorized request");
  }
  res.redirect("/urls");
});


// ------------------------------------------------------------ //
//  POST => request to save the shortURL in the db + redirect
// ------------------------------------------------------------ //

app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = req.body;
  
  if (!urlDatabase[shortURL]) {
    res.send("The shortURL doesn't exist");
  }
  else if (urlDatabase[shortURL]) {
    urlDatabase[shortURL] = longURL;
    res.redirect("/urls");
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
    res.send("Invalid email or password combination.");
  }
  res.redirect("/urls");
});

// ------------------------------------------------------------ //
//           POST => request to logout + redirect
// ------------------------------------------------------------ //

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
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
      password: bcryptjs.hashSync(password, 8)
    };
    res.cookie('user_id', newUserId);
    res.redirect('/urls');
  }
});



