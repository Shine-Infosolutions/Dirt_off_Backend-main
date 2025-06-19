const mongoose = require("mongoose");

const NewEntrySchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // this should match the name of your Customer model
      required: true,
    },
    receiptNo: {
      type: Number, // This will store the incremented receipt number
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "delivered", "collected"],
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
        required: true,
      },
      expectedDeliveryDate: {
        type: Date,
        required: true,
      },
      deliveryDate: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Pre-save middleware to set delivery date when status becomes "delivered"
NewEntrySchema.pre("save", function (next) {
  if (this.status === "delivered" && !this.pickupAndDelivery.deliveryDate) {
    this.pickupAndDelivery.deliveryDate = new Date();
    this.markModified("pickupAndDelivery");
  }
  next();
});

module.exports = mongoose.model("NewEntry", NewEntrySchema);
