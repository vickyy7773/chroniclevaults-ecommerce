import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null/undefined values while maintaining uniqueness
  },
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  costPrice: {
    type: Number,
    default: 0,
    min: [0, 'Cost price cannot be negative']
  },
  profitPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Profit percentage cannot be negative']
  },
  profitAmount: {
    type: Number,
    default: 0,
    min: [0, 'Profit amount cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  gst: {
    type: Number,
    default: 0,
    min: [0, 'GST cannot be negative'],
    max: [100, 'GST cannot exceed 100%']
  },
  hsnCode: {
    type: String,
    trim: true,
    maxlength: [20, 'HSN Code cannot exceed 20 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide product category'],
    trim: true
  },
  subCategory: {
    type: String,
    required: [true, 'Please provide product sub-category'],
    trim: true
  },
  year: {
    type: String,
    required: [true, 'Please provide product year/era'],
    trim: true,
    maxlength: [10, 'Year/Era cannot exceed 10 characters']
  },
  rarity: {
    type: String,
    required: [true, 'Please provide product rarity'],
    trim: true
    // Enum removed - values managed via FilterOptions in database
  },
  condition: {
    type: String,
    required: [true, 'Please provide product condition'],
    trim: true
  },
  denomination: {
    type: String,
    trim: true
  },
  metal: {
    type: String,
    trim: true
  },
  numistaRarityIndex: {
    type: Number,
    min: [0, 'Numista Rarity Index cannot be less than 0'],
    max: [100, 'Numista Rarity Index cannot exceed 100']
  },
  specifications: [{
    key: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    required: true
  }],
  video: {
    type: String,
    trim: true
  },
  inStock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search optimization
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });

// Pre-save hook to calculate profit automatically
productSchema.pre('save', function(next) {
  // Calculate profit if cost price is provided
  if (this.costPrice > 0) {
    // If profit percentage is provided, calculate selling price
    if (this.profitPercentage > 0 && (!this.price || this.isModified('costPrice') || this.isModified('profitPercentage'))) {
      this.profitAmount = (this.costPrice * this.profitPercentage) / 100;
      this.price = this.costPrice + this.profitAmount;
    }
    // If price is provided, calculate profit percentage
    else if (this.price > 0) {
      this.profitAmount = this.price - this.costPrice;
      this.profitPercentage = (this.profitAmount / this.costPrice) * 100;
    }
  }
  next();
});

// Pre-save hook to generate slug from product name
productSchema.pre('save', async function(next) {
  if (this.isModified('name') || !this.slug) {
    // Create base slug from name: "1909-S VDB Lincoln Penny" -> "1909-s-vdb-lincoln-penny"
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen

    let slug = baseSlug;

    // Check if slug already exists
    let count = 0;
    while (true) {
      const existingProduct = await mongoose.models.Product.findOne({
        slug: slug,
        _id: { $ne: this._id }
      });

      if (!existingProduct) {
        break;
      }

      // If slug exists, add counter or ID
      count++;
      if (this._id) {
        slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
        break;
      } else {
        slug = `${baseSlug}-${count}`;
      }
    }

    this.slug = slug;
  }
  next();
});

export default mongoose.model('Product', productSchema);
