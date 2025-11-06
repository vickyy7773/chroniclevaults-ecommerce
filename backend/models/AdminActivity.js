import mongoose from 'mongoose';

const adminActivitySchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    enum: ['login', 'logout', 'create', 'update', 'delete', 'view'],
    required: true
  },
  module: {
    type: String, // e.g., 'products', 'orders', 'users', 'categories'
    required: function() {
      return this.activityType !== 'login' && this.activityType !== 'logout';
    }
  },
  action: {
    type: String, // Detailed description of action
    required: true
  },
  targetId: {
    type: String, // ID of the item being modified
  },
  targetName: {
    type: String, // Name/title of the item being modified
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // Store what was changed (before/after)
  },
  sessionId: {
    type: String // To track session duration
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
adminActivitySchema.index({ admin: 1, timestamp: -1 });
adminActivitySchema.index({ activityType: 1, timestamp: -1 });
adminActivitySchema.index({ module: 1, timestamp: -1 });

export default mongoose.model('AdminActivity', adminActivitySchema);
