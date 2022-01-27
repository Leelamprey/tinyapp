const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");


//Functions for use

const generateRandomString = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rString = '';
  
  while (rString.length < 6) {
    rString += chars[Math.floor(Math.random() * chars.length)];
  }

  return rString;
};



const urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca", 
    userID: "userRandomID" },
  "9sm5xK": { 
    longURL: "http://www.google.com", 
    userID: "user2RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const addUser = (email, password) => {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  return id;
};

const findUser = email => {
  return Object.values(users).find(user => user.email === email);
};

const checkPassword = (user, password) => {
  if (user.password === password) {
    return true;
  } else { 
    return false;
  }
};

const userUrls = (id) => {
  let fUrls = {};
  for (let urlID of Object.keys(urlDatabase)) {
    if (urlDatabase[urlID].userID === id) {
      fUrls[urlID] = urlDatabase[urlID];
    }
  }
  return fUrls;
};

const checkEmail = email => {
  return Object.values(users).find(user => user.email === email);
}

//Gets

app.get("/urls2.json", (req, res) => {
  res.json(users);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]],
    urls: userUrls(req.cookies["user_id"])
  };
  if (templateVars.user) {
    res.render("urls_index", templateVars);
  } else {
    res.status(400).send("You need to login or register to access this page");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  if (!templateVars.user) {
    res.status(400).send("You need to register or login to access this page");
  }
  if (req.cookies["user_id"] === urlDatabase[templateVars.shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("This TinyURL doesn't belong to you!");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

app.get("/register", (req,res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

//Posts

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!(email || !password)) {
    res.status(400).send('Email and/or password is missing');
  } else if (findUser(email)) {
    res.status(400).send('This email has already been registered')
  } else {
    const user_id = addUser(email, password);
    res.cookie('user_id', user_id);
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.cookies['user_id'];
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.cookies["user_id"] === urlDatabase[shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).send("You are not allowed to delete that TinyURL!");
  }
})

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (req.cookies["user_id"] === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(400).send("Your are not allowed to edit that TinyURL!")
  }
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  const user = findUser(email);
  if (!user) {
    res.status(403).send("Email cannot be found");
  } else if (!checkPassword(user, password))  {
    res.status(403).send("Wrong password");
  } else {
    res.cookie('user_id', user.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

