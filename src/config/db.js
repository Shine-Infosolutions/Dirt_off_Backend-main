// config/db.js
const mongoose = require('mongoose');
const ReceiptNumber = require('../models/ReceiptNumber');  // Import the ReceiptNumber model

const connectDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {});
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Check if the receipt number is already initialized
    const existingRecord = await ReceiptNumber.findOne();
    if (!existingRecord) {
      // Initialize the receipt number if not found
      const initialReceipt = new ReceiptNumber({ currentReceiptNumber: 1 });
      await initialReceipt.save();
      console.log("Receipt number initialized to 0001");
    } else {
      console.log("Receipt number already initialized.");
    }

  } catch (error) {
    console.error('Database connection error:', error.message);  // More specific logging
    process.exit(1);  // Exit the process if connection fails
  }
};

module.exports = connectDB;
