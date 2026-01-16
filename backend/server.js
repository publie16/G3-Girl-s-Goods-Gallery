const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./db");
const User = require("./models/User");
const Product = require("./models/Product");

const app = express();
const PORT = 3000;

// Connect to Database
connectDB();

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
app.post("/signup", async (req, res) => {
  const { name, email, password, phone, room, block } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.send("User already exists");
    }

    const newUser = new User({ name, email, password, phone, room, block });
    await newUser.save();

    console.log("New user created:", newUser);
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Handle login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.send("Invalid credentials");
    }

    // ✅ SAVE USER IN SESSION
    req.session.user = {
      name: user.name,
      id: user._id
    };

    // ✅ REDIRECT TO MARKET
    res.redirect("/market");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
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

/* ========= API ROUTES FOR PRODUCTS ========= */

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 }); // Newest first
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Create product
app.post("/api/products", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: "Failed to save product" });
  }
});

// Update product (Mark as Sold)
app.patch("/api/products/:id/sold", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { sold: true }, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ========= START SERVER =========
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
