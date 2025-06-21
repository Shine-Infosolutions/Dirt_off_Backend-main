const express = require("express");
const router = express.Router();

const {
  createNewentry,
  getAllEntry,
  getEntryById,
  getPaginatedEntries,
  updateEntry,
  deleteEntry,
  searchEntry,
  getRecentOrdersCount,
  getPendingDeliveries,
  toggleVisibility,
  getEntryStats,
} = require("../controllers/NewentryController");

// Define specific routes first
router.post("/create", createNewentry);
router.get("/pagination", getPaginatedEntries);
router.get("/search", searchEntry);
router.get("/stats/recent", getRecentOrdersCount);
router.get("/stats", getEntryStats); // Add this before /:id
router.get("/pending/deliveries", getPendingDeliveries);
router.get("/", getAllEntry);

// Define dynamic routes with parameters last
router.get("/:id", getEntryById);
router.put("/update/:id", updateEntry);
router.delete("/delete/:id", deleteEntry);
router.put("/toggleVisibility/:id", toggleVisibility);

module.exports = router;
