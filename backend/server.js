const express = require("express");
const path = require("path");
const session = require("express-session");
const users = require("./users");

const app = express();
const PORT = 3000;

// ========= MIDDLEWARE =========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SESSION (must be BEFORE routes)
app.use(session({
  secret: "g3-secret",
  resave: false,
  saveUninitialized: true
}));

// Static files
app.use(express.static(path.join(__dirname, "../frontend")));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend"));

/* ========= ROUTES ========= */

// Login page
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

// Handle signup
app.post("/signup", (req, res) => {
  const { name, email, password, phone, room, block } = req.body;

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.send("User already exists");
  }

  users.push({ name, email, password, phone, room, block });
  console.log("Current users:", users);

  res.redirect("/login");
});

// Handle login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.send("Invalid credentials");
  }

  // ✅ SAVE USER IN SESSION
  req.session.user = {
    name: user.name
  };

  // ✅ REDIRECT TO MARKET
  res.redirect("/market");
});

// Market page
app.get("/market", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.render("market.ejs", {
    name: req.session.user.name
  });
});

// ========= START SERVER =========
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
