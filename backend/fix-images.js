import mongoose from 'mongoose';
import Product from './models/Product.js';

const fixImages = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Simple colored SVG data URIs (no internet needed)
    const localImages = {
      'TEST001': ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23FF6B6B"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="white" text-anchor="middle" dy=".3em"%3ETest Product 1%3C/text%3E%3C/svg%3E'],
      'TEST002': ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%234ECDC4"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="white" text-anchor="middle" dy=".3em"%3ETest Product 2%3C/text%3E%3C/svg%3E'],
      'TEST003': ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%2395E1D3"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="white" text-anchor="middle" dy=".3em"%3ETest Product 3%3C/text%3E%3C/svg%3E']
    };

    const products = await Product.find({});

    for (const product of products) {
      if (localImages[product.productCode]) {
        product.images = localImages[product.productCode];
        await product.save();
        console.log(`✅ Updated images for ${product.name}`);
      }
    }

    console.log('\n✅ All images updated to local SVG data URIs (no internet needed)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixImages();
