const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    category: {
        type: String,
        enum: ['Clothing', 'Food', 'Personal Care', 'Electronics', 'Pre-Loved', 'Other'],
        default: 'Other'
    },
    mode: {
        type: String,
        enum: ['buy', 'rent', 'borrow'],
        default: 'buy'
    },
    seller: {
        name: String,
        hostel: String,
        room: String,
        id: String // Store User ID for linking
    },
    sold: { type: Boolean, default: false },
    rented: { type: Boolean, default: false },
    rentedTill: { type: String },
});

module.exports = mongoose.model('Product', productSchema);
