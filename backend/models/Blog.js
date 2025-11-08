import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true
  },
  fullContent: {
    type: String,
    required: [true, 'Full content is required']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  readTime: {
    type: String,
    required: [true, 'Read time is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  showInHistory: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better search performance
blogSchema.index({ title: 'text', excerpt: 'text' });
blogSchema.index({ status: 1 });
blogSchema.index({ createdAt: -1 });

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
