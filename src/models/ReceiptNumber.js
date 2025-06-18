// models/ReceiptNumber.js
const mongoose = require('mongoose');

const ReceiptNumberSchema = new mongoose.Schema({
  currentReceiptNumber: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('ReceiptNumber', ReceiptNumberSchema);
