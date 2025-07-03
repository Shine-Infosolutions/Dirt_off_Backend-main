const Staff = require("../models/StaffDetails");

// Create
exports.createStaff = async (req, res) => {
  try {
    const { firstName, phone, email } = req.body;

    if (!firstName || !phone || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing" });
    }

    const staff = new Staff(req.body);
    await staff.save();

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All
exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Staff fetched successfully",
      data: staffList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updateStaff = async (req, res) => {
  try {
    const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete
exports.deleteStaff = async (req, res) => {
  try {
    const deleted = await Staff.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res
      .status(200)
      .json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaginatedStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Staff.countDocuments();
    const staffList = await Staff.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: sort by newest

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalStaff: total,
      data: staffList,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.searchStaff = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Query is required" });
    }

    // Split the query into words
    const words = q.trim().split(/\s+/);

    let searchConditions = [];

    if (words.length === 1) {
      // Single word search - search in all fields
      const word = words[0];
      searchConditions = [
        { firstName: { $regex: word, $options: "i" } },
        { lastName: { $regex: word, $options: "i" } },
        { phone: { $regex: word, $options: "i" } },
        { email: { $regex: word, $options: "i" } },
      ];
    } else if (words.length >= 2) {
      // Multiple words - search for firstName + lastName combinations
      const [firstWord, secondWord] = words;
      searchConditions = [
        // First word as firstName, second as lastName
        {
          $and: [
            { firstName: { $regex: firstWord, $options: "i" } },
            { lastName: { $regex: secondWord, $options: "i" } },
          ],
        },
        // Second word as firstName, first as lastName
        {
          $and: [
            { firstName: { $regex: secondWord, $options: "i" } },
            { lastName: { $regex: firstWord, $options: "i" } },
          ],
        },
        // Also include individual word matches
        { firstName: { $regex: firstWord, $options: "i" } },
        { lastName: { $regex: firstWord, $options: "i" } },
        { firstName: { $regex: secondWord, $options: "i" } },
        { lastName: { $regex: secondWord, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const staff = await Staff.find({
      $or: searchConditions,
    });

    if (!staff.length) {
      return res
        .status(404)
        .json({ success: false, message: "No staff found" });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("Error searching staff:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
