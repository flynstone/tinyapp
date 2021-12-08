const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {

};


// ------------------------------------------------------------ //
//                 Default route
// ------------------------------------------------------------ //

app.get("/", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_index", templateVars);
});

// ------------------------------------------------------------ //
//              GET => request for Index Route
// ------------------------------------------------------------ //

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});


// ------------------------------------------------------------ //
//                GET => request for New Url
// ------------------------------------------------------------ //

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_new", templateVars);
});

// ------------------------------------------------------------ //
//              GET => request for Register
// ------------------------------------------------------------ //

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_register", templateVars);
});

// ------------------------------------------------------------ //
//            GET => request for selected shortURL
// ------------------------------------------------------------ //

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

// ------------------------------------------------------------ //
//   GET => request redirecting to the corresponding longURL
// ------------------------------------------------------------ //

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL === undefined) {
    res.send(302);
  } else {
    res.redirect(longURL);
  }
});

// ------------------------------------------------------------ //
//  POST => request creating shortURL random string + redirect
// ------------------------------------------------------------ //

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// ------------------------------------------------------------ //
//     POST => request to delete a shortURL + redirect
// ------------------------------------------------------------ //

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});


// ------------------------------------------------------------ //
//  POST => request to save the shortURL in the db + redirect
// ------------------------------------------------------------ //

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls')
});

// ------------------------------------------------------------ //
//           POST => request to login + redirect
// ------------------------------------------------------------ //

app.post("/login", (req, res) => {
  const user = users[req.cookies.user_id];
  res.cookie('user_id', user);
  res.redirect('/urls');
});

// ------------------------------------------------------------ //
//           POST => request to logout + redirect
// ------------------------------------------------------------ //

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// ------------------------------------------------------------ //
//           POST => request to Register + redirect
// ------------------------------------------------------------ //

app.post("/register", (req, res) => {
  const user_id = generateRandomString(users);
  users[user_id] = { id: user_id, email: req.body.email, password: req.body.password };
  res.cookie('user_id', user_id);
  res.redirect('/urls');

});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

