import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const addSlugsToProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products without slugs
    const productsWithoutSlugs = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`\n📦 Found ${productsWithoutSlugs.length} products without slugs`);

    if (productsWithoutSlugs.length === 0) {
      console.log('✅ All products already have slugs!');
      process.exit(0);
    }

    // Update each product to trigger slug generation
    for (const product of productsWithoutSlugs) {
      try {
        // Just save the product - the pre-save hook will generate the slug
        await product.save();
        console.log(`✅ Added slug to "${product.name}": ${product.slug}`);
      } catch (error) {
        console.error(`❌ Error adding slug to "${product.name}":`, error.message);
      }
    }

    console.log('\n✅ Slug generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addSlugsToProducts();
