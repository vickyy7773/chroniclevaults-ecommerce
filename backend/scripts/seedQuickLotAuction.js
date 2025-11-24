import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Auction from '../models/Auction.js';

// Get dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedQuickLotAuction = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables.');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🗄️  Connected to MongoDB');

    // Create a QUICK lot-based auction with 3 lots (2 minutes each for quick testing)
    const startTime = new Date(Date.now() + 30 * 1000); // Starts in 30 SECONDS!
    const quickLotAuction = new Auction({
      title: '🚀 QUICK TEST: 3 Rare Coins - Sequential Lot Bidding',
      description: 'FAST TESTING: 3 lots, 2 minutes each. Watch them auction one by one automatically!',
      image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
      startingPrice: 1000,
      currentBid: 1000,
      reservePrice: 10000,
      startTime: startTime,
      endTime: new Date(Date.now() + 10 * 60 * 1000), // Ends in 10 minutes (more than enough)
      status: 'Active', // Set as Active immediately
      isGoingGoingGoneEnabled: true,
      isLotBidding: true,
      lotNumber: 1,
      totalLots: 3, // Only 3 lots for quick testing
      lotDuration: 2, // 2 minutes per lot (fast!)
      currentLotStartTime: startTime,
      currentLotEndTime: new Date(startTime.getTime() + 2 * 60 * 1000), // 2 minutes from start
      incrementSlabs: [
        { minPrice: 1, maxPrice: 4999, increment: 100 },
        { minPrice: 5000, maxPrice: 9999, increment: 500 },
        { minPrice: 10000, maxPrice: 19999, increment: 1000 },
        { minPrice: 20000, maxPrice: 10000000, increment: 2000 }
      ],
      lots: [
        {
          lotNumber: 1,
          title: '🥇 Lot 1: 1947 Gold Coin (FIRST)',
          description: 'First lot - Starting now! Test by placing a bid.',
          image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          startingPrice: 1000,
          currentBid: 1000,
          bids: [],
          status: 'Active', // First lot starts as Active
          startTime: startTime,
          endTime: new Date(startTime.getTime() + 2 * 60 * 1000)
        },
        {
          lotNumber: 2,
          title: '🥈 Lot 2: Silver Rupee (SECOND)',
          description: 'Second lot - Will start after Lot 1 is SOLD',
          image: 'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800',
          startingPrice: 1500,
          currentBid: 1500,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 3,
          title: '🥉 Lot 3: Bronze Coin (FINAL)',
          description: 'Third and final lot - Will start after Lot 2 is SOLD',
          image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          startingPrice: 2000,
          currentBid: 2000,
          bids: [],
          status: 'Upcoming'
        }
      ]
    });

    await quickLotAuction.save();

    console.log('\n🎉 ========================================');
    console.log('    QUICK TEST AUCTION CREATED!');
    console.log('========================================\n');

    console.log(`📦 Auction: ${quickLotAuction.title}`);
    console.log(`🎯 Total Lots: ${quickLotAuction.totalLots} lots`);
    console.log(`⏱️  Duration per Lot: ${quickLotAuction.lotDuration} MINUTES (Fast!)`);
    console.log(`🚀 Starts: ${quickLotAuction.startTime.toLocaleTimeString()} (30 SECONDS!)`);

    console.log(`\n📋 All Lots:\n`);
    quickLotAuction.lots.forEach((lot, index) => {
      console.log(`  ${lot.lotNumber}. ${lot.title}`);
      console.log(`     💰 Starting Price: ₹${lot.startingPrice.toLocaleString()}`);
      console.log(`     📊 Status: ${lot.status}`);
      console.log('');
    });

    console.log('🎯 ========================================');
    console.log('    TESTING STEPS');
    console.log('========================================\n');
    console.log('⏰ Timeline:');
    console.log('  00:00 - Auction starts with Lot 1');
    console.log('  00:30 - Place your first bid on Lot 1');
    console.log('  01:00 - Wait 30 sec → GOING ONCE! 🔨');
    console.log('  01:30 - Wait 30 sec → GOING TWICE! 🔨🔨');
    console.log('  02:00 - Wait 30 sec → SOLD! 🎉');
    console.log('  02:01 - 🚀 LOT 2 AUTOMATICALLY STARTS!');
    console.log('  02:30 - Bid on Lot 2');
    console.log('  03:00 - GOING ONCE on Lot 2');
    console.log('  03:30 - GOING TWICE on Lot 2');
    console.log('  04:00 - SOLD! → 🚀 LOT 3 STARTS!');
    console.log('  04:30 - Bid on Lot 3');
    console.log('  05:00 - GOING ONCE on Lot 3');
    console.log('  05:30 - GOING TWICE on Lot 3');
    console.log('  06:00 - SOLD! → ✅ ALL DONE!\n');

    console.log('💡 WHAT YOU\'LL SEE:');
    console.log('  ✅ Yellow banner: "GOING ONCE! 🔨"');
    console.log('  ✅ Red banner: "GOING TWICE! 🔨🔨"');
    console.log('  ✅ Green banner: "SOLD! 🎉"');
    console.log('  ✅ Automatic switch to next lot\n');

    console.log('🌐 Open: https://chroniclevaults.com/auctions');
    console.log('⏰ Hurry! Auction starts in 30 SECONDS!\n');

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding quick lot auction:', error);
    process.exit(1);
  }
};

// Run the seeder
seedQuickLotAuction();
