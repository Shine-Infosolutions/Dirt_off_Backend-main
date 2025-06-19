//Not being used

const mongoose = require("mongoose");

const CustomerDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
  },

  address: {
    type: String,
    required: true,
  },
  items: [
    {
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],

  totalAmount: {
    type: Number,
    required: true,
  },

  amountInWords: {
    type: String,
  },

  dateCollected: {
    type: Date,
    required: true,
  },

  dateDelivered: {
    type: Date,
    default: null,
  },

  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "delivered", "collected"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CustomerDetails12", CustomerDetailsSchema);
