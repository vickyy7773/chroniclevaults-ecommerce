import mongoose from 'mongoose';

const coinAllocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Admin who allocated the coins
  },
  notes: {
    type: String,
    default: ''
  },
  allocationDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for faster queries
coinAllocationSchema.index({ userId: 1, allocationDate: -1 });

export default mongoose.model('CoinAllocation', coinAllocationSchema);
