// src/controllers/InvoiceController.js
const Invoice = require("../models/InvoiceDetails");

// Get sales statistics for year, month, and week
exports.getSalesStatistics = async (req, res) => {
  try {
    const { year: queryYear, month: queryMonth } = req.query;
    const now = new Date();

    // Use provided year or current year
    const year = queryYear ? parseInt(queryYear) : now.getFullYear();
    const month = queryMonth ? parseInt(queryMonth) : now.getMonth() + 1;

    // Calculate date ranges
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Calculate current week start (Sunday as first day)
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Run three separate aggregations
    const [yearSales, monthSales, weekSales] = await Promise.all([
      // Year total
      Invoice.aggregate([
        { $match: { createdAt: { $gte: yearStart, $lt: yearEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      // Month total
      Invoice.aggregate([
        { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      // Week total
      Invoice.aggregate([
        { $match: { createdAt: { $gte: weekStart, $lt: weekEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        yearSales: yearSales[0]?.total || 0,
        monthSales: monthSales[0]?.total || 0,
        weekSales: weekSales[0]?.total || 0,
        period: {
          year,
          month,
          weekStart: weekStart.toISOString().split("T")[0],
          weekEnd: weekEnd.toISOString().split("T")[0],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
