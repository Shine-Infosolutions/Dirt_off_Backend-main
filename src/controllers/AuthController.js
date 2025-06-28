const Staff = require("../models/StaffDetails");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ email });
    if (!staff || staff.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      success: true,
      staff: {
        id: staff._id,
        email: staff.email,
        firstName: staff.firstName,
        role: staff.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { login };
