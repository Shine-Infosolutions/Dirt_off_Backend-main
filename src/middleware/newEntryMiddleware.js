// src/middleware/newEntryMiddleware.js
const NewEntry = require("../models/NewEntry");

// Pre-save middleware to set delivery date when status becomes "delivered"
NewEntry.schema.pre("save", function (next) {
  if (this.status === "delivered" && !this.pickupAndDelivery.deliveryDate) {
    this.pickupAndDelivery.deliveryDate = new Date();
    this.markModified("pickupAndDelivery");
  }

  // Set pickup date when status becomes "collected"
  if (this.status === "collected" && !this.pickupAndDelivery.pickupDate) {
    this.pickupAndDelivery.pickupDate = new Date();
    this.markModified("pickupAndDelivery");
  }
  next();
});

module.exports = NewEntry;
