import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import Product from './models/Product.js';

dotenv.config();

const fixImageUrls = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fix Category image URLs
    const categories = await Category.find({});
    let categoryCount = 0;

    for (const category of categories) {
      let updated = false;

      if (category.bannerImage && category.bannerImage.startsWith('http://')) {
        category.bannerImage = category.bannerImage.replace('http://', 'https://');
        updated = true;
      }

      if (category.cardImage && category.cardImage.startsWith('http://')) {
        category.cardImage = category.cardImage.replace('http://', 'https://');
        updated = true;
      }

      if (updated) {
        await category.save();
        categoryCount++;
        console.log(`✅ Fixed: ${category.name}`);
      }
    }

    console.log(`\n✅ Updated ${categoryCount} categories`);

    // Fix Product image URLs
    const products = await Product.find({});
    let productCount = 0;

    for (const product of products) {
      let updated = false;

      // Fix main images array
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(img =>
          img.startsWith('http://') ? img.replace('http://', 'https://') : img
        );
        updated = true;
      }

      // Fix thumbnail
      if (product.thumbnail && product.thumbnail.startsWith('http://')) {
        product.thumbnail = product.thumbnail.replace('http://', 'https://');
        updated = true;
      }

      if (updated) {
        await product.save();
        productCount++;
        console.log(`✅ Fixed: ${product.name}`);
      }
    }

    console.log(`\n✅ Updated ${productCount} products`);
    console.log('\n🎉 Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixImageUrls();
