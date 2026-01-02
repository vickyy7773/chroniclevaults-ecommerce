import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  device: {
    type: String,
    default: 'Unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  os: {
    type: String,
    default: 'Unknown'
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
loginHistorySchema.index({ userId: 1, loginTime: -1 });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

export default LoginHistory;
