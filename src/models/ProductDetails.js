const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ServiceCharge: [  // This holds an array of services and charges
    {
      service: {
        type: String,
        required: true
      },
      charge: {
        type: Number,  // Use Number if you're storing numeric values (recommended)
        required: true
      }
    }
  ],

}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
