import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  heading: {
    type: String,
    trim: true,
    maxlength: [50, 'Heading cannot exceed 50 characters'],
    default: 'Today in History'
  },
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Banner image URL is required']
  },
  linkUrl: {
    type: String,
    default: '/products'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
