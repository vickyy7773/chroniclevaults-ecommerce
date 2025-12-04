import mongoose from 'mongoose';

const uploadedImageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number, // Size in bytes
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  purpose: {
    type: String,
    enum: ['auction', 'product', 'banner', 'blog', 'other'],
    default: 'auction'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedIn: [{
    type: String // Can store auction IDs, product IDs, etc.
  }]
}, {
  timestamps: true
});

// Index for faster queries
uploadedImageSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadedImageSchema.index({ purpose: 1, createdAt: -1 });

const UploadedImage = mongoose.model('UploadedImage', uploadedImageSchema);

export default UploadedImage;
