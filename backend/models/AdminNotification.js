import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['coin_limit_request', 'general', 'alert'],
    default: 'general'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  remainingCoins: {
    type: Number,
    default: 0
  },
  isRead: {
    type: Boolean,
    default: false
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction'
  },
  auctionTitle: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ user: 1 });

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

export default AdminNotification;
