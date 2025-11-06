import mongoose from 'mongoose';
import Product from './models/Product.js';
import Category from './models/Category.js';

const addTestProducts = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Delete all existing products
    await Product.deleteMany({});
    console.log('🗑️  Deleted all existing products');

    // Delete all existing categories
    await Category.deleteMany({});
    console.log('🗑️  Deleted all existing categories');

    // Create test categories
    const categories = await Category.insertMany([
      {
        name: 'Test Category 1',
        slug: 'test-category-1',
        description: 'This is test category 1',
        active: true
      },
      {
        name: 'Test Category 2',
        slug: 'test-category-2',
        description: 'This is test category 2',
        active: true
      }
    ]);

    console.log(`✅ Created ${categories.length} test categories`);

    // Create 3 test products
    const testProducts = [
      {
        productCode: 'TEST001',
        name: 'Local Test Product 1',
        description: 'This is a test product created locally. No online connection. Testing local development environment.',
        price: 1500,
        originalPrice: 2000,
        discount: 25,
        gst: 18,
        category: 'Test Category 1',
        subCategory: 'Test Sub 1',
        year: 2024,
        rarity: 'Common',
        condition: 'New',
        specifications: [
          { key: 'Material', value: 'Test Material' },
          { key: 'Weight', value: '100g' }
        ],
        features: [
          'Feature 1 - Local testing',
          'Feature 2 - Offline development',
          'Feature 3 - No server dependency'
        ],
        images: [
          'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Test+Product+1'
        ],
        inStock: 10,
        sold: 0,
        rating: 4.5,
        numReviews: 5,
        featured: true,
        active: true
      },
      {
        productCode: 'TEST002',
        name: 'Local Test Product 2',
        description: 'Second test product for local development. All data is stored in local MongoDB database.',
        price: 3000,
        originalPrice: 3500,
        discount: 14,
        gst: 18,
        category: 'Test Category 2',
        subCategory: 'Test Sub 2',
        year: 2024,
        rarity: 'Rare',
        condition: 'Excellent',
        specifications: [
          { key: 'Size', value: 'Medium' },
          { key: 'Color', value: 'Blue' }
        ],
        features: [
          'Local data storage',
          'Easy to test',
          'Fast development'
        ],
        images: [
          'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Test+Product+2'
        ],
        inStock: 15,
        sold: 0,
        rating: 4.8,
        numReviews: 8,
        featured: true,
        active: true
      },
      {
        productCode: 'TEST003',
        name: 'Local Test Product 3',
        description: 'Third test product. Perfect for testing admin panel, cart, and checkout functionality locally.',
        price: 5000,
        originalPrice: 6000,
        discount: 17,
        gst: 18,
        category: 'Test Category 1',
        subCategory: 'Test Sub 3',
        year: 2024,
        rarity: 'Very Rare',
        condition: 'Mint',
        specifications: [
          { key: 'Brand', value: 'Test Brand' },
          { key: 'Model', value: 'TX-2024' }
        ],
        features: [
          'Completely local',
          'No internet required',
          'Ready for testing'
        ],
        images: [
          'https://via.placeholder.com/400x400/95E1D3/FFFFFF?text=Test+Product+3'
        ],
        inStock: 20,
        sold: 0,
        rating: 5.0,
        numReviews: 12,
        featured: false,
        active: true
      }
    ];

    const products = await Product.insertMany(testProducts);
    console.log(`✅ Created ${products.length} test products`);

    console.log('\n📋 Test Products Created:');
    products.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   Code: ${p.productCode}`);
      console.log(`   Price: ₹${p.price}`);
      console.log(`   GST: ${p.gst}%`);
      console.log(`   Stock: ${p.inStock}`);
    });

    console.log('\n✅ All done! Your local database is ready with test data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addTestProducts();
