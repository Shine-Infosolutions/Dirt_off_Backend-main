const Customer = require('../models/Customer');

// Create
exports.createCustomer = async (req, res) => {
  try {
    const { firstName, phone, email } = req.body;
    if (!firstName || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Required fields are missing' });
    }

    const customer = new Customer(req.body);
    await customer.save();

    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updateCustomer = async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Customer not found' });

    res.status(200).json({ success: true, message: 'Customer updated', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete
exports.deleteCustomer = async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Customer not found' });

    res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getPaginatedCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Customer.countDocuments();
    const customers = await Customer.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: sort by newest first

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalCustomers: total,
      data:customers
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.searchCustomer = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    const customers = await Customer.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    });

    if (!customers.length) {
      return res.status(404).json({ success: false, message: "No customers found" });
    }

    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
