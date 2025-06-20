const Entry = require("../models/NewEntry");
const Customer = require("../models/Customer");

const ReceiptNumber = require("../models/ReceiptNumber"); // Import the ReceiptNumber model

// Create a new entry
exports.createNewentry = async (req, res) => {
  try {
    const {
      customer,
      customerId,
      products,
      charges,
      pickupAndDelivery,

      expectedDeliveryDate,
    } = req.body;

    if (!customer || !customerId || !pickupAndDelivery.expectedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: "Customer, customerId and expected delivery date are required",
      });
    }

    // Ensure tax values are set for each product
    if (products) {
      products.forEach((product) => {
        if (!product.tax && product.tax !== 0) {
          product.tax = 0; // Default tax to 0 if not provided
        }
      });
    }

    // Ensure taxAmount is set in charges
    if (charges && !charges.taxAmount && charges.taxAmount !== 0) {
      charges.taxAmount = 0; // Default taxAmount to 0 if not provided
    }

    // Fetch the current receipt number and increment it
    const receiptRecord = await ReceiptNumber.findOne();
    if (!receiptRecord) {
      return res.status(500).json({
        success: false,
        message: "Receipt number initialization failed",
      });
    }

    const receiptNo = String(receiptRecord.currentReceiptNumber).padStart(
      4,
      "0"
    );

    // Increment the receipt number for the next entry
    receiptRecord.currentReceiptNumber += 1;
    await receiptRecord.save();

    // Create the new entry with the generated receipt number
    const newEntry = new Entry({
      customer,
      customerId,
      receiptNo,
      expectedDeliveryDate,
      products,
      charges,
      pickupAndDelivery,
    });

    await newEntry.save();

    res.status(201).json({
      success: true,
      message: "Entry created successfully",
      data: newEntry,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllEntry = async (req, res) => {
  try {
    const { showAll } = req.query;
    let query = {};

    // Only show visible entries unless showAll=true
    if (showAll !== "true") {
      query.visible = true;
    }

    const entry = await Entry.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "All Entry", data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const { products, charges, status } = req.body;

    // If products are being updated, ensure tax values are included
    if (products) {
      products.forEach((product) => {
        if (!product.tax && product.tax !== 0) {
          product.tax = 0;
        }
      });
    }

    // If charges are being updated, ensure taxAmount is included
    if (charges && !charges.taxAmount && charges.taxAmount !== 0) {
      charges.taxAmount = 0;
    }

    // Handle date updates based on status changes
    if (status === "delivered") {
      req.body["pickupAndDelivery.deliveryDate"] = new Date();
    }

    if (status === "collected") {
      req.body["pickupAndDelivery.pickupDate"] = new Date();
    }

    const updatedEntry = await Entry.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedEntry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    res.status(200).json({
      success: true,
      message: "Entry updated successfully",
      data: updatedEntry,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const Product = require("../models/ProductDetails");

exports.getEntryById = async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry Not found" });
    }

    // Get all product names from the entry
    const productNames = entry.products.map((product) => product.productName);

    // Fetch tax information for these products
    const productTaxes = await Product.find({
      name: { $in: productNames },
    }).select("name tax");

    // Create a map of product name to tax
    const taxMap = {};
    productTaxes.forEach((product) => {
      taxMap[product.name] = product.tax || 0;
    });

    // Add tax to each product in the entry
    const entryData = entry.toObject(); // Convert to plain object to modify

    entryData.products = entryData.products.map((product) => {
      // Use tax from product model if available, otherwise use default 0
      product.tax = taxMap[product.productName] || 0;
      return product;
    });

    res.status(200).json({
      success: true,
      message: "Entry fetched successfully",
      data: entryData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry Not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getPaginatedEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 10; // default to 10 per page

    const skip = (page - 1) * limit;

    const total = await Entry.countDocuments();
    const entries = await Entry.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: newest first

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalEntries: total,
      data: entries,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.searchEntry = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    const entries = await Entry.find({
      $or: [
        { customer: { $regex: q, $options: "i" } }, // case-insensitive search by name
        { receiptNo: { $regex: q, $options: "i" } }, // case-insensitive search by receipt number
      ],
    });

    if (!entries.length) {
      return res
        .status(404)
        .json({ success: false, message: "No entries found" });
    }

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    console.error("Entry search error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Count orders and sales data
// Count orders and sales data - highly optimized version
exports.getRecentOrdersCount = async (req, res) => {
  try {
    // Use caching to improve performance
    const cacheKey = `stats_${new Date().toISOString().split("T")[0]}`;
    const cachedData = global.statsCache?.[cacheKey];

    // Return cached data if available and less than 1 hour old
    if (cachedData && Date.now() - cachedData.timestamp < 3600000) {
      return res.status(200).json({
        success: true,
        data: cachedData.data,
        cached: true,
      });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Simplified aggregation - combine all data in a single query
    const aggregationResult = await Entry.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          yearlySales: [
            {
              $group: {
                _id: { $year: "$createdAt" },
                totalSales: { $sum: "$charges.totalAmount" },
                orderCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          monthlySales: [
            { $match: { createdAt: { $gte: new Date(currentYear, 0, 1) } } },
            {
              $group: {
                _id: { $month: "$createdAt" },
                totalSales: { $sum: "$charges.totalAmount" },
                orderCount: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          weeklyData: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() - 6
                  ),
                },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                },
                totalSales: { $sum: "$charges.totalAmount" },
                orderCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Extract results
    const result = aggregationResult[0];
    const totalCount = result.totalCount[0]?.count || 0;
    const yearlySales = result.yearlySales || [];
    const monthlyData = result.monthlySales || [];
    const weeklyRawData = result.weeklyData || [];

    // Process monthly data
    const monthlySales = [];
    for (let month = 1; month <= currentMonth; month++) {
      const existingData = monthlyData.find((item) => item._id === month);
      monthlySales.push({
        month,
        totalSales: existingData?.totalSales || 0,
        orderCount: existingData?.orderCount || 0,
      });
    }

    // Process weekly data
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayData = weeklyRawData.find(
        (d) =>
          d._id.year === date.getFullYear() &&
          d._id.month === date.getMonth() + 1 &&
          d._id.day === date.getDate()
      );

      weeklyData.push({
        date: dateStr,
        totalSales: dayData?.totalSales || 0,
        orderCount: dayData?.orderCount || 0,
      });
    }

    const responseData = {
      totalOrders: totalCount,
      yearlySales: yearlySales.map((item) => ({
        year: item._id,
        totalSales: item.totalSales,
        orderCount: item.orderCount,
      })),
      monthlySales,
      weeklyData,
    };

    // Cache the result
    if (!global.statsCache) global.statsCache = {};
    global.statsCache[cacheKey] = {
      timestamp: Date.now(),
      data: responseData,
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error counting recent orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.getPendingDeliveries = async (req, res) => {
  try {
    const { type } = req.query;
    // Get today's date in IST (GMT+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istNow = new Date(now.getTime() + istOffset);

    // Get today's date string in YYYY-MM-DD format
    const todayString = istNow.toISOString().split("T")[0];

    // Create start and end of today in UTC (accounting for IST offset)
    const startOfToday = new Date(todayString + "T00:00:00.000Z");
    const endOfToday = new Date(todayString + "T23:59:59.999Z");

    let responseData = {};

    switch (type) {
      case "pending":
        const pendingOrders = await Entry.find({ status: "pending" }).sort({
          createdAt: -1,
        });
        responseData = {
          type: "pending",
          count: pendingOrders.length,
          orders: pendingOrders,
        };
        break;

      case "collected":
        const collectedOrders = await Entry.find({ status: "collected" }).sort({
          createdAt: -1,
        });
        responseData = {
          type: "collected",
          count: collectedOrders.length,
          orders: collectedOrders,
        };
        break;

      case "delivered":
        const deliveredOrders = await Entry.find({ status: "delivered" }).sort({
          createdAt: -1,
        });
        responseData = {
          type: "delivered",
          count: deliveredOrders.length,
          orders: deliveredOrders,
        };
        break;

      case "todayExpected":
        const todayExpectedOrders = await Entry.find({
          "pickupAndDelivery.expectedDeliveryDate": {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        }).sort({ createdAt: -1 });
        responseData = {
          type: "todayExpected",
          count: todayExpectedOrders.length,
          date: todayString,
          orders: todayExpectedOrders,
        };
        break;

      case "todayReceived":
        const todayReceivedOrders = await Entry.find({
          createdAt: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        }).sort({ createdAt: -1 });
        responseData = {
          type: "todayReceived",
          count: todayReceivedOrders.length,
          date: todayString,
          orders: todayReceivedOrders,
        };
        break;

      default:
        // Return summary if no specific type is requested
        const [
          pendingCount,
          collectedCount,
          deliveredCount,
          todayExpectedCount,
          todayReceivedCount,
        ] = await Promise.all([
          Entry.countDocuments({ status: "pending" }),
          Entry.countDocuments({ status: "collected" }),
          Entry.countDocuments({ status: "delivered" }),
          Entry.countDocuments({
            "pickupAndDelivery.expectedDeliveryDate": {
              $gte: startOfToday,
              $lte: endOfToday,
            },
          }),
          Entry.countDocuments({
            createdAt: {
              $gte: startOfToday,
              $lte: endOfToday,
            },
          }),
        ]);

        responseData = {
          summary: {
            pending: { count: pendingCount },
            collected: { count: collectedCount },
            delivered: { count: deliveredCount },
            todayExpected: { count: todayExpectedCount, date: todayString },
            todayReceived: { count: todayReceivedCount, date: todayString },
            total: pendingCount + collectedCount + deliveredCount,
          },
        };
    }

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching pending deliveries:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Toggle entry visibility
exports.toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Entry.findById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    // Toggle the visibility
    entry.visible = !entry.visible;
    await entry.save();

    res.status(200).json({
      success: true,
      message: `Entry is now ${entry.visible ? "visible" : "hidden"}`,
      data: { id: entry._id, visible: entry.visible },
    });
  } catch (error) {
    console.error("Error toggling entry visibility:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
