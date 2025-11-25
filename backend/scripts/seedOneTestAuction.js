import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Auction from '../models/Auction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedOneTestAuction = async () => {
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

    const startTime = new Date(Date.now() + 1 * 60 * 1000); // Starts in 1 minute

    const testAuction = new Auction({
      title: '🎯 TEST: 1947 Gold Coin - Live Bidding',
      description: 'Quick test auction for testing live bidding features. Going, Going, Gone enabled!',
      image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
      startingPrice: 1000,
      currentBid: 1000,
      reservePrice: 5000,
      startTime: startTime,
      endTime: new Date(Date.now() + 16 * 60 * 1000), // 16 minutes total
      status: 'Upcoming',
      isGoingGoingGoneEnabled: true,
      isLotBidding: false,
      incrementSlabs: [
        { minPrice: 1, maxPrice: 4999, increment: 100 },
        { minPrice: 5000, maxPrice: 9999, increment: 500 },
        { minPrice: 10000, maxPrice: 19999, increment: 1000 },
        { minPrice: 20000, maxPrice: 10000000, increment: 2000 }
      ]
    });

    await testAuction.save();

    console.log('\n🎉 ========================================');
    console.log('    TEST AUCTION CREATED!');
    console.log('========================================\n');

    console.log(`📦 Title: ${testAuction.title}`);
    console.log(`💰 Starting Bid: ₹${testAuction.startingPrice.toLocaleString()}`);
    console.log(`🎯 Reserve Price: ₹${testAuction.reservePrice.toLocaleString()}`);
    console.log(`🚀 Starts: ${testAuction.startTime.toLocaleTimeString()}`);
    console.log(`🏁 Ends: ${testAuction.endTime.toLocaleTimeString()}`);
    console.log(`⏱️  Duration: 15 minutes`);
    console.log(`🔨 Going, Going, Gone: ENABLED (30-sec intervals)`);

    console.log('\n💡 FEATURES:');
    console.log('  ✅ Live bidding with real-time updates');
    console.log('  ✅ Auto-increment bidding (₹100 per bid)');
    console.log('  ✅ Frozen coins system');
    console.log('  ✅ Going, Going, Gone warnings');
    console.log('  ✅ Socket.io real-time notifications');

    console.log('\n🌐 Open: https://chroniclevaults.com/auctions');
    console.log('⏰ Auction starts in 1 minute!\n');

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating test auction:', error);
    process.exit(1);
  }
};

seedOneTestAuction();
