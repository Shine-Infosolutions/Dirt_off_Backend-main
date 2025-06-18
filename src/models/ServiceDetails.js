const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  taxPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
}, {
  timestamps: true 
});

module.exports = mongoose.model('Service', serviceSchema);
