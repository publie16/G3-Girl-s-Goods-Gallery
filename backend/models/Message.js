const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // Storing name for simplicity in MVP
    senderId: { type: String },
    receiver: { type: String, required: true }, // Storing name
    receiverId: { type: String },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    productId: { type: String }, // Optional, linking to a product
    read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
