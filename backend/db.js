const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/g3';
    await mongoose.connect(connStr);
    console.log(`✅ MongoDB Connected: ${connStr.includes('localhost') ? 'Local' : 'Atlas Cloud'}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
