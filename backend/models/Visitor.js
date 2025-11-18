import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  totalCount: {
    type: Number,
    default: 1000,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Visitor', visitorSchema);
