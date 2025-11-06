import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import Product from './models/Product.js';
import Category from './models/Category.js';
import Order from './models/Order.js';

const importData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Read and import products
    const productsFile = path.join(__dirname, 'products-export.json');
    if (fs.existsSync(productsFile)) {
      const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));

      // Delete existing products
      await Product.deleteMany({});
      console.log('🗑️  Deleted existing products');

      // Insert new products
      await Product.insertMany(productsData);
      console.log(`✅ Imported ${productsData.length} products`);
    }

    // Import categories if file exists
    const categoriesFile = path.join(__dirname, 'categories-export.json');
    if (fs.existsSync(categoriesFile)) {
      const categoriesData = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
      if (categoriesData.length > 0) {
        await Category.deleteMany({});
        await Category.insertMany(categoriesData);
        console.log(`✅ Imported ${categoriesData.length} categories`);
      }
    }

    // Import orders if file exists
    const ordersFile = path.join(__dirname, 'orders-export.json');
    if (fs.existsSync(ordersFile)) {
      const ordersData = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
      if (ordersData.length > 0) {
        await Order.deleteMany({});
        await Order.insertMany(ordersData);
        console.log(`✅ Imported ${ordersData.length} orders`);
      }
    }

    console.log('✅ Data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

importData();
