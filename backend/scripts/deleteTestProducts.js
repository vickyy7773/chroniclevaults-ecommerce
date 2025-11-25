import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const deleteTestProducts = async () => {
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

    // Delete all products with "test" in slug
    const result = await Product.deleteMany({
      slug: { $regex: 'test', $options: 'i' }
    });

    console.log('\n🗑️  ========================================');
    console.log('    TEST PRODUCTS DELETED!');
    console.log('========================================\n');

    console.log(`✅ Deleted ${result.deletedCount} test products\n`);

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error deleting test products:', error);
    process.exit(1);
  }
};

deleteTestProducts();
