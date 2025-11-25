import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedTestProducts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB URI not found');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🗄️  Connected to MongoDB');

    // Get first category
    const category = await Category.findOne();

    if (!category) {
      console.error('❌ No categories found. Please create a category first.');
      process.exit(1);
    }

    console.log(`📂 Using category: ${category.name}`);

    // Create 5 test products with all required fields
    const testProducts = [
      {
        name: '1947 Independence Gold Coin',
        description: 'Rare commemorative gold coin from India\'s independence year. Pristine condition with original luster.',
        price: 25000,
        originalPrice: 28000,
        discount: 10,
        category: category.name,
        subCategory: 'Gold Coins',
        year: '1947',
        rarity: 'Rare',
        condition: 'Uncirculated',
        metal: 'Gold',
        denomination: '1 Mohur',
        stock: 5,
        images: [
          'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800'
        ],
        isFeatured: true,
        isActive: true
      },
      {
        name: '1950 First Coin Series',
        description: 'First coin series of independent India. Complete set in excellent condition.',
        price: 15000,
        originalPrice: 17000,
        discount: 12,
        category: category.name,
        subCategory: 'Silver Coins',
        year: '1950',
        rarity: 'Very Rare',
        condition: 'Extremely Fine',
        metal: 'Silver',
        denomination: '1 Rupee',
        stock: 8,
        images: [
          'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800'
        ],
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Silver Rupee Collection 1960s',
        description: 'Beautiful collection of silver rupees from the 1960s era. 10 coins in total.',
        price: 8500,
        originalPrice: 10000,
        discount: 15,
        category: category.name,
        subCategory: 'Silver Coins',
        year: '1960-1969',
        rarity: 'Common',
        condition: 'Very Fine',
        metal: 'Silver',
        denomination: '1 Rupee',
        stock: 12,
        images: [
          'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800'
        ],
        isFeatured: false,
        isActive: true
      },
      {
        name: 'Bronze Anna Set - Pre-Independence',
        description: 'Rare bronze anna coins from British India period. Historical significance.',
        price: 5000,
        originalPrice: 6000,
        discount: 17,
        category: category.name,
        subCategory: 'Bronze Coins',
        year: '1940-1946',
        rarity: 'Rare',
        condition: 'Fine',
        metal: 'Bronze',
        denomination: '1/4 Anna',
        stock: 15,
        images: [
          'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800'
        ],
        isFeatured: false,
        isActive: true
      },
      {
        name: 'Commemorative 10 Rupee Coin - 1975 FAO',
        description: 'Food and Agriculture Organization commemorative coin from 1975. Limited edition.',
        price: 3500,
        originalPrice: 4000,
        discount: 12,
        category: category.name,
        subCategory: 'Commemorative Coins',
        year: '1975',
        rarity: 'Uncommon',
        condition: 'Uncirculated',
        metal: 'Copper-Nickel',
        denomination: '10 Rupees',
        stock: 20,
        images: [
          'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800'
        ],
        isFeatured: false,
        isActive: true
      }
    ];

    // Insert products
    const createdProducts = await Product.insertMany(testProducts);

    console.log('\n✅ Test products created successfully!\n');
    console.log('📦 Products:');
    createdProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     💰 Price: ₹${product.price.toLocaleString()}`);
      console.log(`     🏷️  Discounted: ₹${product.discountedPrice.toLocaleString()}`);
      console.log(`     📦 Stock: ${product.stock} units`);
      console.log('');
    });

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding test products:', error);
    process.exit(1);
  }
};

seedTestProducts();
