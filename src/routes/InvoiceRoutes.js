// src/routes/InvoiceRoutes.js
const express = require("express");
const router = express.Router();
const { getSalesStatistics } = require("../controllers/InvoiceController");

// Get sales statistics
router.get("/sales-statistics", getSalesStatistics);

module.exports = router;
