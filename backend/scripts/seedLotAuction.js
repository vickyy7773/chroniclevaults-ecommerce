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

const seedLotAuction = async () => {
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

    // Create a lot-based auction with 10 lots
    const lotAuction = new Auction({
      title: 'Vintage Coin Collection Auction - 10 Rare Lots',
      description: 'Sequential lot bidding for 10 rare vintage coins. Each lot will be auctioned one by one. Lot duration: 5 minutes each.',
      image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
      startingPrice: 5000,
      currentBid: 5000,
      reservePrice: 50000,
      startTime: new Date(Date.now() + 1 * 60 * 1000), // Starts in 1 minute
      endTime: new Date(Date.now() + 60 * 60 * 1000), // Ends in 60 minutes (enough for all lots)
      isGoingGoingGoneEnabled: true,
      isLotBidding: true,
      lotNumber: 1, // Start with lot 1
      totalLots: 10,
      lotDuration: 5, // 5 minutes per lot
      incrementSlabs: [
        { minPrice: 1, maxPrice: 9999, increment: 500 },
        { minPrice: 10000, maxPrice: 19999, increment: 1000 },
        { minPrice: 20000, maxPrice: 49999, increment: 2000 },
        { minPrice: 50000, maxPrice: 99999, increment: 5000 },
        { minPrice: 100000, maxPrice: 10000000, increment: 10000 }
      ],
      lots: [
        {
          lotNumber: 1,
          title: 'Lot 1: 1947 Independence Gold Coin',
          description: 'Rare gold coin commemorating India\'s independence',
          image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          startingPrice: 5000,
          currentBid: 5000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 2,
          title: 'Lot 2: 1950 Silver Rupee',
          description: 'First year silver rupee of independent India',
          image: 'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800',
          startingPrice: 3000,
          currentBid: 3000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 3,
          title: 'Lot 3: 1962 Bronze Anna',
          description: 'Last year of Anna series',
          image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          startingPrice: 2000,
          currentBid: 2000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 4,
          title: 'Lot 4: 1975 Commemorative 10 Rupee',
          description: 'FAO series commemorative coin',
          image: 'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800',
          startingPrice: 4000,
          currentBid: 4000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 5,
          title: 'Lot 5: 1985 Proof Set',
          description: 'Complete proof set from 1985',
          image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          startingPrice: 8000,
          currentBid: 8000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 6,
          title: 'Lot 6: 1991 Economic Reform Coin',
          description: 'Commemorating economic liberalization',
          image: 'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800',
          startingPrice: 6000,
          currentBid: 6000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 7,
          title: 'Lot 7: 2000 Millennium Coin',
          description: 'Special millennium edition',
          image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          startingPrice: 7000,
          currentBid: 7000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 8,
          title: 'Lot 8: 2010 Commonwealth Games Set',
          description: 'Complete CWG commemorative set',
          image: 'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800',
          startingPrice: 10000,
          currentBid: 10000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 9,
          title: 'Lot 9: 2015 Rare Error Coin',
          description: 'Rare minting error coin',
          image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
          startingPrice: 15000,
          currentBid: 15000,
          bids: [],
          status: 'Upcoming'
        },
        {
          lotNumber: 10,
          title: 'Lot 10: 2020 Platinum Jubilee',
          description: 'Limited edition platinum jubilee coin',
          image: 'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800',
          startingPrice: 20000,
          currentBid: 20000,
          bids: [],
          status: 'Upcoming'
        }
      ]
    });

    // Set the first lot as Active when auction starts
    const now = new Date();
    if (now >= lotAuction.startTime) {
      lotAuction.lotNumber = 1;
      lotAuction.lots[0].status = 'Active';
      lotAuction.lots[0].startTime = now;
      lotAuction.lots[0].endTime = new Date(now.getTime() + lotAuction.lotDuration * 60 * 1000);
      lotAuction.currentLotStartTime = lotAuction.lots[0].startTime;
      lotAuction.currentLotEndTime = lotAuction.lots[0].endTime;
      lotAuction.status = 'Active';
    }

    await lotAuction.save();

    console.log('\n✅ Lot-based auction created successfully!');
    console.log(`\n📦 Auction: ${lotAuction.title}`);
    console.log(`🎯 Total Lots: ${lotAuction.totalLots}`);
    console.log(`⏱️  Duration per Lot: ${lotAuction.lotDuration} minutes`);
    console.log(`🚀 Start Time: ${lotAuction.startTime.toLocaleTimeString()}`);
    console.log(`🏁 End Time: ${lotAuction.endTime.toLocaleTimeString()}`);
    console.log(`\n📋 Lots:`);

    lotAuction.lots.forEach((lot, index) => {
      console.log(`\n  ${index + 1}. ${lot.title}`);
      console.log(`     Starting Price: ₹${lot.startingPrice.toLocaleString()}`);
      console.log(`     Status: ${lot.status}`);
    });

    console.log('\n\n🎯 HOW IT WORKS:');
    console.log('1. Auction starts in 1 minute with Lot 1');
    console.log('2. Each lot runs for 5 minutes');
    console.log('3. After "SOLD!" (3rd Going, Going, Gone warning), next lot automatically starts');
    console.log('4. Total duration: Up to 50 minutes (10 lots × 5 minutes)');
    console.log('5. Users bid on current active lot only');
    console.log('\n💡 Test by placing bids and waiting for warnings!');

    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding lot auction:', error);
    process.exit(1);
  }
};

// Run the seeder
seedLotAuction();
