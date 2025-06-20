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
        // Convert receiptNo to string for comparison if it's a number
        { receiptNo: isNaN(q) ? { $exists: false } : parseInt(q) }, // Only search by receiptNo if q is a number
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

// Count orders and sales data - optimized without caching
exports.getRecentOrdersCount = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Single aggregation query with all data
    const result = await Entry.aggregate([
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
                  dateString: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                },
                totalSales: { $sum: "$charges.totalAmount" },
                orderCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Process results
    const data = result[0];
    const totalCount = data.totalCount[0]?.count || 0;

    // Process monthly data
    const monthlyMap = {};
    data.monthlySales.forEach((item) => {
      monthlyMap[item._id] = item;
    });

    const monthlySales = [];
    for (let month = 1; month <= currentMonth; month++) {
      monthlySales.push({
        month,
        totalSales: monthlyMap[month]?.totalSales || 0,
        orderCount: monthlyMap[month]?.orderCount || 0,
      });
    }

    // Process weekly data
    const weeklyMap = {};
    data.weeklyData.forEach((item) => {
      weeklyMap[item._id.dateString] = item;
    });

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      weeklyData.push({
        date: dateStr,
        totalSales: weeklyMap[dateStr]?.totalSales || 0,
        orderCount: weeklyMap[dateStr]?.orderCount || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalOrders: totalCount,
        yearlySales: data.yearlySales.map((item) => ({
          year: item._id,
          totalSales: item.totalSales,
          orderCount: item.orderCount,
        })),
        monthlySales,
        weeklyData,
      },
    });
  } catch (error) {
    console.error("Error counting recent orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// api to fetch dashboard stats
exports.getPendingDeliveries = async (req, res) => {
  try {
    const { type, page = 1 } = req.query;
    const pageNum = parseInt(page);
    const limit = 5; // Fixed limit of 5 items per page
    const skip = (pageNum - 1) * limit;

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
    let query = {};
    let total = 0;

    switch (type) {
      case "pending":
        query = { status: "pending" };
        total = await Entry.countDocuments(query);
        const pendingOrders = await Entry.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        responseData = {
          type: "pending",
          count: total,
          page: pageNum,
          totalPages: Math.ceil(total / limit),
          orders: pendingOrders,
        };
        break;

      case "collected":
        query = { status: "collected" };
        total = await Entry.countDocuments(query);
        const collectedOrders = await Entry.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        responseData = {
          type: "collected",
          count: total,
          page: pageNum,
          totalPages: Math.ceil(total / limit),
          orders: collectedOrders,
        };
        break;

      case "delivered":
        query = { status: "delivered" };
        total = await Entry.countDocuments(query);
        const deliveredOrders = await Entry.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        responseData = {
          type: "delivered",
          count: total,
          page: pageNum,
          totalPages: Math.ceil(total / limit),
          orders: deliveredOrders,
        };
        break;

      case "todayExpected":
        query = {
          "pickupAndDelivery.expectedDeliveryDate": {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        };
        total = await Entry.countDocuments(query);
        const todayExpectedOrders = await Entry.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        responseData = {
          type: "todayExpected",
          count: total,
          page: pageNum,
          totalPages: Math.ceil(total / limit),
          date: todayString,
          orders: todayExpectedOrders,
        };
        break;

      case "todayReceived":
        query = {
          createdAt: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        };
        total = await Entry.countDocuments(query);
        const todayReceivedOrders = await Entry.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        responseData = {
          type: "todayReceived",
          count: total,
          page: pageNum,
          totalPages: Math.ceil(total / limit),
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
