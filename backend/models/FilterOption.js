import mongoose from 'mongoose';

const FilterOptionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Filter type is required'],
    enum: ['rarity', 'condition', 'denomination', 'metal'],
    index: true
  },
  value: {
    type: String,
    required: [true, 'Filter value is required'],
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique values within each type
FilterOptionSchema.index({ type: 1, value: 1 }, { unique: true });

// Static method to get all options by type
FilterOptionSchema.statics.getByType = function(type) {
  return this.find({ type, isActive: true })
    .sort({ displayOrder: 1, value: 1 })
    .select('-__v');
};

// Static method to get all filter options grouped by type
FilterOptionSchema.statics.getAllGrouped = async function() {
  const options = await this.find({ isActive: true })
    .sort({ type: 1, displayOrder: 1, value: 1 })
    .select('-__v');

  // Group by type
  const grouped = {
    rarity: [],
    condition: [],
    denomination: [],
    metal: []
  };

  options.forEach(option => {
    if (grouped[option.type]) {
      grouped[option.type].push(option.value);
    }
  });

  return grouped;
};

export default mongoose.model('FilterOption', FilterOptionSchema);
