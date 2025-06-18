const Service = require('../models/ServiceDetails');

// Create
exports.createService = async (req, res) => {
  try {
    const { serviceName, description, taxPercent } = req.body;

    if (!serviceName || taxPercent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'serviceName and taxPercent are required',
      });
    }

    const service = new Service({ serviceName, description, taxPercent });
    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Services fetched successfully',
      data: services,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service fetched successfully',
      data: service,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updateService = async (req, res) => {
  try {
    const { serviceName, taxPercent } = req.body;

    if (!serviceName || taxPercent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'serviceName and taxPercent are required for update',
      });
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete
exports.deleteService = async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getPaginatedServices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Service.countDocuments();
    const services = await Service.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: newest first

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalServices: total,
      data:services
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.searchService = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const services = await Service.find({
      $or: [
        { serviceName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ]
    });

    if (!services.length) {
      return res.status(404).json({ success: false, message: "No services found" });
    }

    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error("Service search error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
