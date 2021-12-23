const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcryptjs = require("bcryptjs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
  maxAge: 24 * 60 * 60 * 1000
}));

// Url database
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userId: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userId: "user2RandomID" }
};

// Users database
const users = { };

// Import helpers
const {
  urlsForUser,
  generateRandomString,
  emailExists,
  checkPassword,
} = require("./helpers");

app.set("view engine", "ejs");


// ------------------------------------------------------------ //
//                        App Port
// ------------------------------------------------------------ //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// ------------------------------------------------------------ //
//                      Default route
// ------------------------------------------------------------ //

app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId]
  };
    
  res.render("urls_index", templateVars);
});


// ------------------------------------------------------------ //
//                GET => request for New Url
// ------------------------------------------------------------ //

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId]
  };
  if (!userId) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  } 
});


// ------------------------------------------------------------ //
//            GET => request for selected shortURL
// ------------------------------------------------------------ //

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const { shortURL } = req.params;
  const userUrls = urlsForUser(userId, urlDatabase);
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[userId]
  }
  if (Object.keys(userUrls).includes(shortURL)) {
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("You do not have permission to edit this url");
  }
});

// ------------------------------------------------------------ //
//              GET => request for Register
// ------------------------------------------------------------ //

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId],
  }
  res.render("urls_register", templateVars);
});

// ------------------------------------------------------------ //
//              GET => request for Login
// ------------------------------------------------------------ //

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[userId],
  }
  res.render("urls_login", templateVars);
});


// ------------------------------------------------------------ //
//   GET => request redirecting to the corresponding longURL
// ------------------------------------------------------------ //

app.get("/u/:shortURL", (req, res) => {
  const { longURL } = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.status(404).send("Not Found");
  } else {
    res.redirect(longURL);
  }
});

// ------------------------------------------------------------ //
//  POST => request creating shortURL random string + redirect
// ------------------------------------------------------------ //

app.post("/urls", (req, res) => {
  let userId = req.session.user_id;
  let shortURL = generateRandomString();

  if (userId) {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userId
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(400).send("You must be logged in to see this content");
  }
});

// ------------------------------------------------------------ //
//     POST => request to update a url
// ------------------------------------------------------------ //

app.post("/urls/:id", (req, res) => {
  const { longURL } = req.body;
  const shortURL = req.params.id;
  const userId = req.session.user_id;
  const userUrls = urlsForUser(userId, urlDatabase);

  if (Object.keys(userUrls).includes(shortURL)) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");
  } else {
    res.status(400).send("Please login to edit urls");
  }
});

// ------------------------------------------------------------ //
//     POST => request to delete a shortURL + redirect
// ------------------------------------------------------------ //

app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const { shortURL } = req.params;

  const userUrls = urlsForUser(userId, urlDatabase);
  if (Object.keys(userUrls).includes(shortURL)) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).send("You do not own this url!");
  }
});

// ------------------------------------------------------------ //
//           POST => request to login + redirect
// ------------------------------------------------------------ //

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = checkPassword(email, password, users);
  if (user) {
    users[req.session.user_id];
    res.redirect('/urls');
    return;
  } else {
    res.status(403).send("Invalid credentials");
  }
});

// ------------------------------------------------------------ //
//           POST => request to logout + redirect
// ------------------------------------------------------------ //

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// ------------------------------------------------------------ //
//           POST => request to Register + redirect
// ------------------------------------------------------------ //

app.post("/register", (req, res) => {
  let newId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;

  // Check if email or password 
  if (!newEmail || !newPassword) {
    const templateVars = {
      user: null,
      error: "Email or Password input error!"
    };
    res.render("register", templateVars);
  }

  // Throw error if email is already taken
  else if (emailExists(users, newEmail)) {
    const templateVars = {
      user: null,
      error: "Email already exists as user!"
    };
    res.render("register", templateVars);
  }
  
  else {
    // Create new user
    const newUser = {
      userID: newId,
      email: newEmail,
      password: bcryptjs.hashSync(newPassword, 10),
    };
    users[newId] = newUser;
    req.session["user_id"] = newId;
    res.redirect("/urls");
  }
});



