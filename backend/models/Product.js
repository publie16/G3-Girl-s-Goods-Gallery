const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    category: { type: String },
    sold: { type: Boolean, default: false },
    rented: { type: Boolean, default: false },
    rentedTill: { type: String },
});

module.exports = mongoose.model('Product', productSchema);
