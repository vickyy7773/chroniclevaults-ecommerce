import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Auction from '../models/Auction.js';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedProductAuction = async () => {
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

    // Get all active products
    const products = await Product.find({ isActive: true }).limit(5);

    if (products.length === 0) {
      console.error('❌ No products found. Please run npm run seed:products first.');
      process.exit(1);
    }

    console.log(`📦 Found ${products.length} products`);

    // Create live bidding auctions for each product
    const auctions = [];
    const startTime = new Date(Date.now() + 2 * 60 * 1000); // Starts in 2 minutes

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const auction = new Auction({
        title: `Live Auction: ${product.name}`,
        description: `${product.description}\n\nProduct Details:\n- Year: ${product.year}\n- Rarity: ${product.rarity}\n- Condition: ${product.condition}\n- Metal: ${product.metal}\n- Denomination: ${product.denomination}`,
        image: product.images[0] || 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
        product: product._id,
        startingPrice: Math.floor(product.price * 0.7), // Start at 70% of product price
        currentBid: Math.floor(product.price * 0.7),
        reservePrice: product.price, // Reserve price = product price
        startTime: new Date(startTime.getTime() + (i * 3 * 60 * 1000)), // Stagger by 3 minutes each
        endTime: new Date(startTime.getTime() + (i * 3 * 60 * 1000) + (15 * 60 * 1000)), // 15 minutes duration
        status: 'Upcoming',
        isGoingGoingGoneEnabled: true,
        isLotBidding: false,
        incrementSlabs: [
          { minPrice: 1, maxPrice: 4999, increment: 100 },
          { minPrice: 5000, maxPrice: 9999, increment: 500 },
          { minPrice: 10000, maxPrice: 19999, increment: 1000 },
          { minPrice: 20000, maxPrice: 49999, increment: 2000 },
          { minPrice: 50000, maxPrice: 10000000, increment: 5000 }
        ]
      });

      auctions.push(auction);
    }

    // Insert all auctions
    const createdAuctions = await Auction.insertMany(auctions);

    console.log('\n🎉 ========================================');
    console.log('    PRODUCT AUCTIONS CREATED!');
    console.log('========================================\n');

    console.log(`📦 Total Auctions: ${createdAuctions.length}\n`);

    createdAuctions.forEach((auction, index) => {
      const product = products[index];
      console.log(`${index + 1}. ${auction.title}`);
      console.log(`   💰 Starting Bid: ₹${auction.startingPrice.toLocaleString()}`);
      console.log(`   🎯 Reserve Price: ₹${auction.reservePrice.toLocaleString()}`);
      console.log(`   🚀 Starts: ${auction.startTime.toLocaleTimeString()}`);
      console.log(`   🏁 Ends: ${auction.endTime.toLocaleTimeString()}`);
      console.log(`   📦 Product: ${product.name}`);
      console.log(`   ⭐ Rarity: ${product.rarity}`);
      console.log('');
    });

    console.log('🎯 ========================================');
    console.log('    AUCTION DETAILS');
    console.log('========================================\n');
    console.log('⏰ Timeline:');
    console.log('  🕐 First auction starts in 2 minutes');
    console.log('  📊 Each auction runs for 15 minutes');
    console.log('  🔄 Auctions staggered by 3 minutes');
    console.log('  🔨 Going, Going, Gone enabled (30-sec intervals)');
    console.log('\n💡 FEATURES:');
    console.log('  ✅ Real product bidding');
    console.log('  ✅ Starting bid = 70% of product price');
    console.log('  ✅ Reserve price = full product price');
    console.log('  ✅ Auto-increment bidding');
    console.log('  ✅ Frozen coins system');
    console.log('  ✅ Going, Going, Gone warnings\n');

    console.log('🌐 Open: https://chroniclevaults.com/auctions');
    console.log('⏰ First auction starts in 2 minutes!\n');

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding product auctions:', error);
    process.exit(1);
  }
};

seedProductAuction();
