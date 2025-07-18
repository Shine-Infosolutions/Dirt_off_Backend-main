const mongoose = require("mongoose");

const NewEntrySchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: Number,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    receiptNo: {
      type: Number,
      required: true,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "collected", "processedAndPacked", "delivered"],
      default: "pending",
    },

    // service: {
    //   type: String,
    // },

    products: [
      {
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number, // Can be derived: quantity * unitPrice
          required: true,
        },
        tax: {
          type: Number,
          default: 0,
        },
      },
    ],

    charges: {
      subtotal: {
        type: Number,
        required: true,
      },
      taxAmount: {
        type: Number,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },
    discount: {
      type: Number,
      default: 0, // Default to 0 if not provided
    },
    pickupAndDelivery: {
      pickupAddress: {
        type: String,
        required: true,
      },
      deliveryAddress: {
        type: String,
        required: true,
      },
      pickupType: {
        type: String,
        enum: ["Self", "Agent", "Courier"],
        required: true,
      },
      deliveryType: {
        type: String,
        enum: ["Self", "Agent", "Courier"],
        required: true,
      },
      pickupDate: {
        type: Date,
        default: null,
      },
      processedAndPackedDate: {
        type: Date,
        default: null,
      },
      expectedDeliveryDate: {
        type: Date,
        required: true,
      },
      deliveryDate: {
        type: Date,
        default: null,
      },
      remarks: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

// Indexes for performance optimization
NewEntrySchema.index({ createdAt: 1 });
NewEntrySchema.index({ status: 1 });
NewEntrySchema.index({ "charges.totalAmount": 1 });
NewEntrySchema.index({ "pickupAndDelivery.expectedDeliveryDate": 1 });
NewEntrySchema.index({ visible: 1 });

module.exports = mongoose.model("NewEntry", NewEntrySchema);
