import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
    trim: true
  },
  buttonLink: {
    type: String,
    default: '/products',
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Please provide an image']
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Sort by order by default
sliderSchema.index({ order: 1 });

export default mongoose.model('Slider', sliderSchema);
