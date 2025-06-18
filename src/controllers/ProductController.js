const Product = require('../models/ProductDetails');

// Create
exports.createProduct = async (req, res) => {
  try {
    const { name, ServiceCharge } = req.body;
    
    // Validate required fields
    if (!name || !ServiceCharge || ServiceCharge.length === 0) {
      return res.status(400).json({ success: false, message: 'Required fields (name and ServiceCharge) are missing' });
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getPaginatedProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: sort by newest

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
     data: products
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.searchProduct = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const products = await Product.find({
      name: { $regex: q, $options: 'i' }, // case-insensitive partial match
    });

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

