import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FilterOption from './models/FilterOption.js';

dotenv.config();

const defaultOptions = [
  // Rarity
  { type: 'rarity', value: 'Common', displayOrder: 1 },
  { type: 'rarity', value: 'Uncommon', displayOrder: 2 },
  { type: 'rarity', value: 'Rare', displayOrder: 3 },
  { type: 'rarity', value: 'Very Rare', displayOrder: 4 },
  { type: 'rarity', value: 'Extremely Rare', displayOrder: 5 },

  // Condition
  { type: 'condition', value: 'Poor', displayOrder: 1 },
  { type: 'condition', value: 'Fair', displayOrder: 2 },
  { type: 'condition', value: 'Good', displayOrder: 3 },
  { type: 'condition', value: 'Very Fine', displayOrder: 4 },
  { type: 'condition', value: 'Extremely Fine', displayOrder: 5 },
  { type: 'condition', value: 'Uncirculated', displayOrder: 6 },

  // Denomination
  { type: 'denomination', value: 'Penny', displayOrder: 1 },
  { type: 'denomination', value: 'Nickel', displayOrder: 2 },
  { type: 'denomination', value: 'Dime', displayOrder: 3 },
  { type: 'denomination', value: 'Quarter', displayOrder: 4 },
  { type: 'denomination', value: 'Half Dollar', displayOrder: 5 },
  { type: 'denomination', value: 'Dollar', displayOrder: 6 },
  { type: 'denomination', value: 'Rupee', displayOrder: 7 },
  { type: 'denomination', value: 'Paise', displayOrder: 8 },
  { type: 'denomination', value: 'Anna', displayOrder: 9 },

  // Metal
  { type: 'metal', value: 'Gold', displayOrder: 1 },
  { type: 'metal', value: 'Silver', displayOrder: 2 },
  { type: 'metal', value: 'Bronze', displayOrder: 3 },
  { type: 'metal', value: 'Copper', displayOrder: 4 },
  { type: 'metal', value: 'Nickel', displayOrder: 5 },
  { type: 'metal', value: 'Brass', displayOrder: 6 },
  { type: 'metal', value: 'Platinum', displayOrder: 7 },
  { type: 'metal', value: 'Aluminum', displayOrder: 8 }
];

const seedFilterOptions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if options already exist
    const existingCount = await FilterOption.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Filter options already exist (${existingCount} records). Skipping initialization.`);
      process.exit(0);
    }

    // Insert default options
    await FilterOption.insertMany(defaultOptions);
    console.log(`✅ Successfully seeded ${defaultOptions.length} filter options`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding filter options:', error);
    process.exit(1);
  }
};

seedFilterOptions();
