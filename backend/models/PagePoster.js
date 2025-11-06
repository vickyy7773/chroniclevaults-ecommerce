import mongoose from 'mongoose';

const pagePosterSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: [true, 'Page name is required'],
    enum: ['Coins', 'BankNotes', 'Books', 'Accessories', 'Stamps', 'Medals'],
    unique: true
  },
  posterImage: {
    type: String,
    required: [true, 'Poster image is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  subtitle: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('PagePoster', pagePosterSchema);
