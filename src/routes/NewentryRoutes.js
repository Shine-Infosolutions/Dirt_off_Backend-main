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
} = require("../controllers/NewentryController");
router.post("/create", createNewentry);
router.get("/pagination", getPaginatedEntries); // More specific, so must come before '/:id'
router.get("/", getAllEntry);
router.get("/search", searchEntry);
router.get("/:id", getEntryById);
router.put("/update/:id", updateEntry);
router.delete("/delete/:id", deleteEntry);
router.get("/stats/recent", getRecentOrdersCount);
router.get("/pending/deliveries", getPendingDeliveries);
router.put("/toggleVisibility/:id", toggleVisibility);

module.exports = router;
