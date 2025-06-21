// src/models/EntryStat.js
const mongoose = require("mongoose");

const EntryStatSchema = new mongoose.Schema(
  {
    totalEntries: {
      type: Number,
      default: 0,
    },
    pendingCount: {
      type: Number,
      default: 0,
    },
    collectedCount: {
      type: Number,
      default: 0,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },
    todayExpectedCount: {
      type: Number,
      default: 0,
    },
    todayReceivedCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EntryStat", EntryStatSchema);
