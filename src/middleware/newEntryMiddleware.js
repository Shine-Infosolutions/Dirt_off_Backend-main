// src/middleware/newEntryMiddleware.js
const NewEntry = require("../models/NewEntry");

// Pre-save middleware to set dates when status changes
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

  // Set processedAndPacked date when status becomes "processedAndPacked"
  if (
    this.status === "processedAndPacked" &&
    !this.pickupAndDelivery.processedAndPackedDate
  ) {
    this.pickupAndDelivery.processedAndPackedDate = new Date();
    this.markModified("pickupAndDelivery");
  }
  next();
});

module.exports = NewEntry;
