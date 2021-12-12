const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcryptjs = require('bcryptjs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["wuyjfx36v47dj"]
}));

// Url database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "testUserId"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "userTestId"
  }
};

// Users database
const users = {
  "testUserId": {
    id: "testUserId",
    email: "user@test.com",
    password: bcryptjs.hashSync("purple-monkey-dinosaur", 10) 
  },
  "userTestId": {
    id: "userTestId",
    email: "test@user.com",
    password: bcryptjs.hashSync("dishwasher-funk", 10)
  }
}

// Import helpers
const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
  emailExists,
  checkPassword,
  getUserById
} = require("./helpers");

app.set("view engine", "ejs");


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
  let user_id = users[req.session["user_id"]];
  if (user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// ------------------------------------------------------------ //
//              GET => request for Index Route// ------------------------------------------------------------ //
//  POST => request to save the shortURL in the db + redirect
// ------------------------------------------------------------ //
/*
app.post("/urls/:shortURL", (req, res) => {
  const { shortUrl } = req.params;
  const user_id = req.session.user_id;

  if (!urlDatabase[shortUrl]) {
    res.sendStatus(404);
  }
  if (user_id !== urlDatabase[shortUrl].user_id) {
    res.sendStatus(403);    
  }
  urlDatabase[shortUrl].longUrl = req.body.longUrl;
  res.redirect("/urls")
});*/
// ------------------------------------------------------------ //

app.get("/urls", (req, res) => {
  let user_id = users[req.session["user_id"]];
  if (user_id) {
    let userUrls = urlsForUser(urlDatabase, user_id["id"]);
    const templateVars = {
      user: user_id,
      urls: userUrls
    };
    res.render("urls_index", templateVars);
  } else {
    const templateVars = {
      user: false //needs to be false to to show error on page to login/register
    };
    res.render("urls_index", templateVars);
  }
});


// ------------------------------------------------------------ //
//                GET => request for New Url
// ------------------------------------------------------------ //

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect('/login');
  }
  res.render("urls_new", { user });
});


// ------------------------------------------------------------ //
//            GET => request for selected shortURL
// ------------------------------------------------------------ //

app.get("/urls/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  let currentUser = users[req.session["user_id"]];
  let display;

  // Check if url belongs to current user
  if (currentUser) {
    if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
      display = true; 
    } else {
      display = false; 
    }

    if (longURL) {
      const templateVars = {
        user: currentUser,
        shortURL: req.params.shortURL,
        longURL: longURL,                         
        display
      };

      res.render("urls_show", templateVars);
    }
    else {
      res.send("URL does not exist.");
    }
  }
  else {
    res.status(403).redirect("/login");
  }
});

// ------------------------------------------------------------ //
//              GET => request for Register
// ------------------------------------------------------------ //

app.get("/register", (req, res) => {
  const id = req.session.user_id;
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
  const id = req.session.user_id;
  const user = id ? users[id] : null;
  const templateVars = {
    user
  }
  res.render("urls_login", templateVars);
});


// ------------------------------------------------------------ //
//   GET => request redirecting to the corresponding longURL
// ------------------------------------------------------------ //

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// ------------------------------------------------------------ //
//  POST => request creating shortURL random string + redirect
// ------------------------------------------------------------ //

app.post("/urls", (req, res) => {
  let user_id = req.session.user_id;
  let shortURL = generateRandomString();

  if (getUserById(user_id, users)) {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      user_id: user_id
    };
    res.redirect("/urls");
  } 

  else {
    return res.status(400).send("You must be logged in to see this content");
  }
});

// ------------------------------------------------------------ //
//     POST => request to update a url
// ------------------------------------------------------------ //

app.post("/urls/:shortURL", (req, res) => {
let user_id = req.session.user_id;
  //check if URL belongs to user's list then they can edit
  if (urlsForUser(urlDatabase, user_id)[req.params.shortURL]) {
    let newURL = req.body.newURL;
    //updating new URL to database
    urlDatabase[req.params.shortURL].longURL = newURL;
    res.redirect("/urls");
  }
});

// ------------------------------------------------------------ //
//     POST => request to delete a shortURL + redirect
// ------------------------------------------------------------ //

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  if (urlDatabase[shortURL] && urlDatabase[shortURL].user_id === userId) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
    return;
  } else {
    res.status(401).send("Operation failed");
  }
});

// ------------------------------------------------------------ //
//           POST => request to login + redirect
// ------------------------------------------------------------ //

app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  let user_id = getUserByEmail(userEmail, users);

  if (checkPassword(userEmail, userPassword, users)) {
    req.session.user_id = user_id;
    res.redirect("/urls");
  } else {
    const templateVars = {
      error: "Invalid credentials",
      user: null
    };
    res.render("/login", templateVars);
  }
});

// ------------------------------------------------------------ //
//           POST => request to logout + redirect
// ------------------------------------------------------------ //

app.post("/logout", (req, res) => {
  delete req.session['user_id'];
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
      id: newId,
      email: newEmail,
      password: bcryptjs.hashSync(newPassword, 10),
    };
    users[newId] = newUser;
    req.session['user_id'] = newId;
    res.redirect("/urls");
  }
});



