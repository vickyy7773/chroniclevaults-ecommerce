import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

// Function to generate slug from product name
const generateSlug = (name, id) => {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen

  // Add product ID to ensure uniqueness
  if (id) {
    slug = `${slug}-${id.toString().slice(-6)}`;
  }

  return slug;
};

const generateSlugsForProducts = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Find all products without slugs
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      if (!product.slug) {
        const slug = generateSlug(product.name, product._id);
        product.slug = slug;
        await product.save();
        console.log(`✅ Generated slug for "${product.name}": ${slug}`);
        updated++;
      } else {
        console.log(`⏭️  Skipping "${product.name}" - already has slug: ${product.slug}`);
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated} products`);
    console.log(`   Skipped: ${skipped} products`);
    console.log(`   Total: ${products.length} products`);
    console.log('\n✨ Slug generation completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

generateSlugsForProducts();
