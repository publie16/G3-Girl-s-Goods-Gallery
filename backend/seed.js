require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to DB
const connectDB = async () => {
    try {
        const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/g3';
        await mongoose.connect(connStr);
        console.log('✅ Connected to DB for Seeding');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    const products = [
        {
            name: "Philips Hair Straightener",
            price: 100,
            description: "Used only twice, good condition. Renting out because I don't use it often.",
            category: "Electronics",
            mode: "rent",
            image: "https://images.unsplash.com/photo-1562362002-3860bb79c3d4?q=80&w=600&auto=format&fit=crop",
            seller: { name: "Diya Sharma", hostel: "Block B", room: "204" }
        },
        {
            name: "Blue Denim Jacket",
            price: 450,
            description: "Vintage style, size M. Super comfortable.",
            category: "Clothing",
            mode: "buy",
            image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600&auto=format&fit=crop",
            seller: { name: "Ananya Gupta", hostel: "Block C", room: "101" }
        },
        {
            name: "Maggie Pack (6-pack)",
            price: 80,
            description: "Extra stock, selling at cost price.",
            category: "Food",
            mode: "buy",
            image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=600&auto=format&fit=crop",
            seller: { name: "Riya Singh", hostel: "Block B", room: "305" }
        },
        {
            name: "Electric Kettle",
            price: 50,
            description: "Available for rent on weekends. Perfect for late night coffee.",
            category: "Electronics",
            mode: "rent",
            image: "https://images.unsplash.com/photo-1594213114663-d94db9b17126?q=80&w=600&auto=format&fit=crop",
            seller: { name: "Khyati Bajaj", hostel: "Block C", room: "402" }
        },
        {
            name: "Scientific Calculator",
            price: 0,
            description: "Borrow for your exams! Just treat it with care.",
            category: "Electronics",
            mode: "borrow",
            image: "https://images.unsplash.com/photo-1587145820266-a5951ee1f620?q=80&w=600&auto=format&fit=crop",
            seller: { name: "Sneha Reddy", hostel: "Block B", room: "112" }
        },
        {
            name: "Dove Body Lotion",
            price: 150,
            description: "Unopened seal pack. Bought extra by mistake.",
            category: "Personal Care",
            mode: "buy",
            image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop",
            seller: { name: "Pooja Verma", hostel: "Block C", room: "210" }
        }
    ];

    await Product.insertMany(products);
    console.log('✅ Seeded 6 products successfully!');
    process.exit();
};

seedData();
