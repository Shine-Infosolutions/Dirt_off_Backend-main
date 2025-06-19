//Not being used

const CustomerDetails = require("../models/CustomerDetails");

exports.createCustomerDetails = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      items,
      totalAmount,
      amountInWords,
      dateCollected,
      dateDelivered,
      notes,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !phone ||
      !address ||
      !items ||
      !totalAmount ||
      !dateCollected
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const newCustomer = new CustomerDetails({
      name,
      phone,
      email,
      address,
      items,
      totalAmount,
      amountInWords,
      dateCollected,
      dateDelivered,
      notes,
    });

    const savedCustomer = await newCustomer.save();

    return res.status(201).json({ success: true, data: savedCustomer });
  } catch (error) {
    console.error("Error creating customer details:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.getCustomerDetails = async (req, res) => {
  try {
    const customer = await CustomerDetails.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Error fetching Customer Details", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.updateCustomerDetails = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      items,
      totalAmount,
      amountInWords,
      dateCollected,
      dateDelivered,
      notes,
    } = req.body;
    const existingCustomer = await CustomerDetails.findById(req.params.id);
    if (!existingCustomer) {
      return res.status(400).json({ error: "Customer Not Found" });
    }
    existingCustomer.name = name || existingCustomer.name;
    existingCustomer.phone = phone || existingCustomer.phone;
    existingCustomer.email = email || existingCustomer.email;
    existingCustomer.address = address || existingCustomer.address;

    existingCustomer.totalAmount = totalAmount || existingCustomer.totalAmount;
    existingCustomer.amountInWords =
      amountInWords || existingCustomer.amountInWords;
    existingCustomer.dateCollected =
      dateCollected || existingCustomer.dateCollected;
    existingCustomer.dateDelivered =
      dateDelivered || existingCustomer.dateDelivered;
    existingCustomer.notes = notes || existingCustomer.notes;
    if (items) {
      existingCustomer.items = items;
    }
    await existingCustomer.save();
    return res.status(200).json({
      message: "Customer Details Updated Successfully",
      success: true,
      data: existingCustomer,
    });
  } catch (error) {
    console.error("Error fteching Customer", error);
    return res.status(500).json({
      success: false,
      message: "Error while Updating",
    });
  }
};
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerDetails.findById(id);
    if (!customer) {
      return res.status(400).json({ error: "Customer Not Found" });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Error fetching Customer by ID", error);
    res.status(500).json({ success: false, message: "Server Error " });
  }
};
exports.deleteCustomerById = async (req, res) => {
  try {
    const customer = await CustomerDetails.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(400).json({ error: "Customer Not Found" });
    }
    res
      .status(200)
      .json({ message: "Customer Deleted Successfully", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.searchCustomer = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res
        .status(400)
        .json({ message: "Please enter a query", success: false });
    }

    // 👇 Escape regex special characters
    const escapeRegex = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    const safeQuery = escapeRegex(query); // 👈 Now it's defined

    const customer = await CustomerDetails.find({
      $or: [
        { name: { $regex: safeQuery, $options: "i" } },
        { phone: { $regex: safeQuery, $options: "i" } },
      ],
    });

    if (!customer || customer.length === 0) {
      return res
        .status(404)
        .json({ message: "Customer not found", success: false });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllCustomerPgination = async (req, res) => {
  try {
    // Get page number from query params (default to 1 if not provided)
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Set the limit to 30
    const skip = (page - 1) * limit; // Calculate the number of records to skip

    // Fetch achievers with pagination
    const customer = await CustomerDetails.find()
      .skip(skip) // Skip records
      .limit(limit) // Limit the number of records per page
      .sort({ createdAt: 1 }); // Optional: Sorting by creation date (descending)

    // If no achievers are found
    if (!customer || customer.length === 0) {
      return res.status(404).json({ message: "No Customer found" });
    }

    // Get the total count of achievers for pagination
    const totalCount = await CustomerDetails.countDocuments();

    res.status(200).json({
      message: "Customer fetched successfully",
      data: customer,
      total: totalCount, // Total number of achievers
      page, // Current page number
      totalPages: Math.ceil(totalCount / limit), // Total number of pages
      limit, // Number of records per page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
