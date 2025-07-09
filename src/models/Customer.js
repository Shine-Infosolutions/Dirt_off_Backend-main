const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Enter a valid email"],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      match: [/^\d{6}$/, "Enter a valid 6-digit postal code"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CustomerDirtoff", customerSchema);
