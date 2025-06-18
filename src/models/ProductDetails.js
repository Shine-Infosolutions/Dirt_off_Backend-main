const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ServiceCharge: [
      // This holds an array of services and charges
      {
        charge: {
          type: Number, // Use Number if you're storing numeric values (recommended)
          required: true,
        },
      },
      {
        tax: {
          type: Number,
          default: 0, // Default tax value is 0
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
