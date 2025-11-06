import mongoose from 'mongoose';
import Product from './models/Product.js';

const fixURLs = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Find all products with server URLs
    const products = await Product.find({
      $or: [
        { images: { $regex: '72.60.202.163' } },
        { images: { $regex: 'localhost:5000' } }
      ]
    });

    console.log(`📦 Found ${products.length} products with URLs to fix`);

    let updated = 0;
    for (const product of products) {
      let needsUpdate = false;

      // Fix image URLs
      if (product.images && product.images.length > 0) {
        product.images = product.images.map(img => {
          if (img.includes('72.60.202.163:5000')) {
            needsUpdate = true;
            return img.replace(/http:\/\/72\.60\.202\.163:5000/g, 'http://localhost:5000');
          }
          // Also fix double URL issue
          if (img.includes('http://localhost:5000http://localhost:5000')) {
            needsUpdate = true;
            return img.replace('http://localhost:5000http://localhost:5000', 'http://localhost:5000');
          }
          return img;
        });
      }

      if (needsUpdate) {
        await product.save();
        updated++;
        console.log(`✅ Updated: ${product.name} (${product.productCode})`);
      }
    }

    console.log(`\n🎉 Updated ${updated} products!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixURLs();
