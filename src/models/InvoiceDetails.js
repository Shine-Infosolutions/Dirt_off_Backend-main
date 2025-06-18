// models/Invoice.js
const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

  items: [
    {
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],

  subTotal: { type: Number, required: true },         // Before discounts and tax
  discount: { type: Number, default: 0 },             // Flat discount amount
  taxRate: { type: Number, default: 0 },              // e.g. 5 for 5%
  taxAmount: { type: Number, default: 0 },            // Calculated based on taxRate
  totalAmount: { type: Number, required: true },      // Final amount (subtotal - discount + tax)
  amountInWords: { type: String },                    // ₹168.00 only
  gstNumber: { type: String },                        // Optional GSTIN
  gstType: {
    type: String,
    enum: ['IGST', 'CGST_SGST', 'NONE'],
    default: 'NONE',
  },

  dateCollected: { type: Date, required: true },
  dateDelivered: { type: Date },
  notes: { type: String },

  status: {
    type: String,
    enum: ['pending', 'delivered', 'collected'],
    default: 'pending',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('InvoiceDirt', InvoiceSchema);
