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
      pickupDate,
      expectedDeliveryDate,
      deliveryDate,
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
      pickupDate,
      expectedDeliveryDate,
      deliveryDate,
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
    const entry = await Entry.find().sort({ createdAt: -1 });
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

    // Handle delivery date when status becomes "delivered"
    if (status === "delivered") {
      req.body["pickupAndDelivery.deliveryDate"] = new Date();
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
exports.getRecentOrdersCount = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get total count
    const count = await Entry.countDocuments();

    // Yearly sales data for all years
    const yearlySales = await Entry.aggregate([
      {
        $group: {
          _id: { $year: "$pickupAndDelivery.pickupDate" },
          totalSales: { $sum: "$charges.totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly sales data for current year
    const monthlyData = await Entry.aggregate([
      {
        $match: {
          "pickupAndDelivery.pickupDate": {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$pickupAndDelivery.pickupDate" },
          totalSales: { $sum: "$charges.totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Create array for all months up to current month with 0 values for missing months
    const monthlySales = [];
    for (let month = 1; month <= currentMonth; month++) {
      const existingData = monthlyData.find((item) => item._id === month);
      monthlySales.push({
        month: month,
        totalSales: existingData ? existingData.totalSales : 0,
        orderCount: existingData ? existingData.orderCount : 0,
      });
    }

    // Weekly sales data for last 7 days
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dayData = await Entry.aggregate([
        {
          $match: {
            "pickupAndDelivery.pickupDate": {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$charges.totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      weeklyData.push({
        date: startOfDay.toISOString().split("T")[0],
        totalSales: dayData[0]?.totalSales || 0,
        orderCount: dayData[0]?.orderCount || 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalOrders: count,
        yearlySales: yearlySales.map((item) => ({
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

// Get orders with empty dateDelivered
exports.getPendingDeliveries = async (req, res) => {
  try {
    // Get today's date in IST (GMT+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istNow = new Date(now.getTime() + istOffset);

    // Get today's date string in YYYY-MM-DD format
    const todayString = istNow.toISOString().split("T")[0];

    // Create start and end of today in UTC (accounting for IST offset)
    const startOfToday = new Date(todayString + "T00:00:00.000Z");
    const endOfToday = new Date(todayString + "T23:59:59.999Z");

    // Count pending and collected orders separately
    const [
      pendingCount,
      collectedCount,
      deliveredCount,
      todayExpectedCount,
      todayReceivedCount,
      pendingOrders,
      collectedOrders,
      deliveredOrders,
      todayExpectedOrders,
      todayReceivedOrders,
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
        "pickupAndDelivery.pickupDate": {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }),
      Entry.find({ status: "pending" }).sort({ createdAt: -1 }),
      Entry.find({ status: "collected" }).sort({ createdAt: -1 }),
      Entry.find({ status: "delivered" }).sort({ createdAt: -1 }),
      Entry.find({
        "pickupAndDelivery.expectedDeliveryDate": {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }).sort({ createdAt: -1 }),
      Entry.find({
        "pickupAndDelivery.pickupDate": {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending: {
          count: pendingCount,
          orders: pendingOrders,
        },
        collected: {
          count: collectedCount,
          orders: collectedOrders,
        },
        delivered: {
          count: deliveredCount,
          // orders: collectedOrders,
        },
        todayExpectedDeliveries: {
          count: todayExpectedCount,
          date: todayString,
          orders: todayExpectedOrders,
        },
        todayReceivedOrders: {
          count: todayReceivedCount,
          date: todayString,
          orders: todayReceivedOrders,
        },
        total: pendingCount + collectedCount + deliveredCount,
      },
    });
  } catch (error) {
    console.error("Error fetching pending deliveries:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
