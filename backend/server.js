const express = require("express");
const path = require("path");
require("dotenv").config(); // Load environment variables
const session = require("express-session");
const connectDB = require("./db");
const User = require("./models/User");
const Product = require("./models/Product");
const Message = require("./models/Message");

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
      id: user._id,
      block: user.block,
      room: user.room
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
    name: req.session.user.name,
    block: req.session.user.block,
    room: req.session.user.room
  });
});

// Sell page
app.get("/sell", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.render("sell.ejs", {
    name: req.session.user.name,
    block: req.session.user.block,
    room: req.session.user.room
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
    console.error("❌ Product Save Error:", err);
    res.status(500).json({ error: "Failed to save product", details: err.message });
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

// Edit Product Price/Details
app.patch("/api/products/:id", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const product = await Product.findById(req.params.id);
    // Check ownership if possible (using seller name for now)
    if (product.seller.name !== req.session.user.name) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ========= WISHLIST API =========
app.post("/api/wishlist/toggle", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });

  const { productId } = req.body;
  try {
    const user = await User.findById(req.session.user.id);
    const index = user.wishlist.indexOf(productId);

    if (index === -1) {
      user.wishlist.push(productId);
      await user.save();
      res.json({ saved: true });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      res.json({ saved: false });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});

app.get("/api/user/wishlist", async (req, res) => {
  if (!req.session.user) return res.json([]);
  try {
    const user = await User.findById(req.session.user.id);
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

app.get("/api/user/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  res.json(req.session.user);
});

// ========= MESSAGING API =========
app.post("/api/messages", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { receiver, content, productId } = req.body;
    const newMessage = new Message({
      sender: req.session.user.name, // Using name for simplicity
      senderId: req.session.user.id,
      receiver,
      content,
      productId
    });
    await newMessage.save();
    res.json({ success: true, message: "Sent!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/messages", async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const messages = await Message.find({
      $or: [
        { receiver: req.session.user.name },
        { sender: req.session.user.name }
      ]
    }).sort({ timestamp: -1 });

    // Group by conversation partner if needed, but for MVP listing all is fine
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Render Messages Page
app.get("/messages", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("messages.ejs", { name: req.session.user.name });
});

// ========= START SERVER =========
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
