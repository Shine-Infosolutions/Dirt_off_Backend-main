const Entry = require('../models/NewEntry');
const Customer = require('../models/Customer');

const ReceiptNumber = require('../models/ReceiptNumber'); // Import the ReceiptNumber model

// Create a new entry
exports.createNewentry = async (req, res) => {
  try {
    const {
      customer,
      customerId,
      // service,
      products,
      charges,
      pickupAndDelivery
    } = req.body;

    if (!customer || !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer, customerId, and service are required'
      });
    }

    // Fetch the current receipt number and increment it
    const receiptRecord = await ReceiptNumber.findOne();
    if (!receiptRecord) {
      return res.status(500).json({
        success: false,
        message: 'Receipt number initialization failed'
      });
    }

    const receiptNo = String(receiptRecord.currentReceiptNumber).padStart(4, '0'); // Format as '0001', '0002', etc.

    // Increment the receipt number for the next entry
    receiptRecord.currentReceiptNumber += 1;
    await receiptRecord.save();

    // Create the new entry with the generated receipt number
    const newEntry = new Entry({
      customer,
      customerId,
      // service,
      receiptNo,  // Use the generated receipt number here
      products,
      charges,
      pickupAndDelivery
    });

    await newEntry.save();

    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      data: newEntry
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


exports.getAllEntry=async(req,res)=>{
    try {
        const entry=await Entry.find().sort({createdAt:-1});
        res.status(200).json({success:true,message:'All Entry',data:entry});
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
exports.updateEntry=async (req, res) => {
  try {
    const updatedEntry = await Entry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedEntry) return res.status(404).json({ success: false, message: 'Entry not found' });

    res.status(200).json({
      success: true,
      message: 'Entry updated successfully',
      data: updatedEntry
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getEntryById=async(req,res)=>{
    try {
        const entry=await Entry.findById(req.params.id);
        if(!entry){
            return res.status(404).json({success:false,message:'Entry Not found'})
        }
        res.status(200).json({success:true,message:'Entry fetched successfully',data:entry});
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
exports.deleteEntry=async(req,res)=>{
    try {
     const entry=await Entry.findByIdAndDelete(req.params.id);
     if(!entry){
        return res.status(404).json({success:false,message:'Entry Not found'})
     }   
     res.status(200).json({success:true,message:'Entry deleted successfully'});
    } catch (error) {
        res.status(500).json({success:false,message:error.message})
    }
}
exports.getPaginatedEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;      // default to page 1
    const limit = parseInt(req.query.limit) || 10;   // default to 10 per page

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
      data:entries
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.searchEntry = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q?.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const entries = await Entry.find({
      $or: [
        { customer: { $regex: q, $options: 'i' } },     // case-insensitive search by name
        { receiptNo: { $regex: q, $options: 'i' } },     // case-insensitive search by receipt number
      ],
    });

    if (!entries.length) {
      return res.status(404).json({ success: false, message: 'No entries found' });
    }

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    console.error('Entry search error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};