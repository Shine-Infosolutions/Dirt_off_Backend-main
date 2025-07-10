// src/middleware/entryStatsMiddleware.js
const mongoose = require("mongoose");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

// Cache setup
let statsCache = null;
let lastCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

// Import models directly
const Entry = require("../models/NewEntry");
const EntryStat = require("../models/EntryStat");

dayjs.extend(utc);
dayjs.extend(timezone);

// Function to update stats
async function updateStats() {
  try {
    const today = dayjs().tz("Asia/Kolkata");
    const startOfToday = today.startOf("day").toDate();
    const endOfToday = today.endOf("day").toDate();

    const [
      totalEntries,
      pendingCount,
      collectedCount,
      processedAndPackedCount,
      deliveredCount,
      todayExpectedCount,
      todayReceivedCount,
    ] = await Promise.all([
      Entry.countDocuments({ visible: true }),
      Entry.countDocuments({ status: "pending", visible: true }),
      Entry.countDocuments({ status: "collected", visible: true }),
      Entry.countDocuments({ status: "processedAndPacked", visible: true }),
      Entry.countDocuments({ status: "delivered", visible: true }),
      Entry.countDocuments({
        "pickupAndDelivery.expectedDeliveryDate": {
          $gte: startOfToday,
          $lte: endOfToday,
        },
        status: { $ne: "delivered" },
        visible: true,
      }),
      Entry.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
        visible: true,
      }),
    ]);

    // Update the database
    const stats = await EntryStat.findOneAndUpdate(
      {},
      {
        totalEntries,
        pendingCount,
        collectedCount,
        processedAndPackedCount,
        deliveredCount,
        todayExpectedCount,
        todayReceivedCount,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update the cache
    statsCache = stats.toObject();
    lastCacheTime = Date.now();

    return stats;
  } catch (err) {
    console.error("Error updating stats:", err);
    throw err;
  }
}

// Initialize stats on application start
function initializeStats() {
  setTimeout(async () => {
    try {
      await updateStats();
      console.log("Entry statistics initialized");
    } catch (err) {
      console.error("Error initializing entry statistics:", err);
    }
  }, 5000); // Wait 5 seconds after app start to ensure DB connection
}

// Register middleware hooks
function registerHooks() {
  const schema = Entry.schema;

  // Post-save hook
  schema.post("save", async () => {
    await updateStats();
  });

  // Post-update hook
  schema.post("findOneAndUpdate", async () => {
    await updateStats();
  });

  // Post-delete hook
  schema.post("findOneAndDelete", async () => {
    await updateStats();
  });

  console.log("Entry stats hooks registered successfully");
}

// Function to manually update stats
async function manualUpdateStats() {
  await updateStats();
}

// Add a function to get stats with caching
async function getStats() {
  // Return cached stats if they're fresh
  if (statsCache && Date.now() - lastCacheTime < CACHE_TTL) {
    return statsCache;
  }

  // Otherwise, update stats and return fresh data
  const stats = await updateStats();
  return stats;
}

// Export the functions
module.exports = {
  updateStats,
  initializeStats,
  registerHooks,
  manualUpdateStats,
  getStats,
};
