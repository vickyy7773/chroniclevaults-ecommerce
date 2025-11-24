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

const sampleAuctions = [
  {
    title: '1947 Gold Coin Collection - Rare Independence Era',
    description: 'A stunning collection of gold coins from 1947, commemorating India\'s independence. This rare set includes 5 coins in pristine condition, perfect for collectors and history enthusiasts.',
    image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800',
    startingPrice: 5000,
    reservePrice: 15000,
    startTime: new Date(Date.now() + 2 * 60 * 1000), // Starts in 2 minutes
    endTime: new Date(Date.now() + 30 * 60 * 1000), // Ends in 30 minutes
    isGoingGoingGoneEnabled: true,
    incrementSlabs: [
      { minPrice: 1, maxPrice: 9999, increment: 500 },
      { minPrice: 10000, maxPrice: 19999, increment: 1000 },
      { minPrice: 20000, maxPrice: 49999, increment: 2000 },
      { minPrice: 50000, maxPrice: 99999, increment: 5000 },
      { minPrice: 100000, maxPrice: 10000000, increment: 10000 }
    ]
  },
  {
    title: 'Vintage Rolex Submariner 1960s',
    description: 'Classic Rolex Submariner from the 1960s. Excellent condition with original dial and bezel. Complete with original box and papers. A true collector\'s piece.',
    image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800',
    startingPrice: 50000,
    reservePrice: 150000,
    startTime: new Date(Date.now() + 5 * 60 * 1000), // Starts in 5 minutes
    endTime: new Date(Date.now() + 45 * 60 * 1000), // Ends in 45 minutes
    isGoingGoingGoneEnabled: true,
    incrementSlabs: [
      { minPrice: 1, maxPrice: 49999, increment: 2000 },
      { minPrice: 50000, maxPrice: 99999, increment: 5000 },
      { minPrice: 100000, maxPrice: 199999, increment: 10000 },
      { minPrice: 200000, maxPrice: 499999, increment: 20000 },
      { minPrice: 500000, maxPrice: 10000000, increment: 50000 }
    ]
  },
  {
    title: 'Rare Blue Diamond - 2.5 Carats',
    description: 'Exceptional natural blue diamond, 2.5 carats, VS1 clarity. GIA certified with excellent cut, color, and clarity. Comes with full certification and authentication documents.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    startingPrice: 100000,
    reservePrice: 300000,
    startTime: new Date(Date.now() + 1 * 60 * 1000), // Starts in 1 minute (ACTIVE SOON!)
    endTime: new Date(Date.now() + 25 * 60 * 1000), // Ends in 25 minutes
    isGoingGoingGoneEnabled: true,
    incrementSlabs: [
      { minPrice: 1, maxPrice: 99999, increment: 5000 },
      { minPrice: 100000, maxPrice: 199999, increment: 10000 },
      { minPrice: 200000, maxPrice: 499999, increment: 20000 },
      { minPrice: 500000, maxPrice: 999999, increment: 50000 },
      { minPrice: 1000000, maxPrice: 10000000, increment: 100000 }
    ]
  },
  {
    title: 'Antique Persian Rug - 19th Century',
    description: 'Magnificent hand-woven Persian rug from the 19th century. Measures 12x18 feet with intricate floral patterns. Authenticated by international rug experts. Museum quality piece.',
    image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800',
    startingPrice: 25000,
    reservePrice: 75000,
    startTime: new Date(Date.now() + 10 * 60 * 1000), // Starts in 10 minutes
    endTime: new Date(Date.now() + 60 * 60 * 1000), // Ends in 60 minutes
    isGoingGoingGoneEnabled: true,
    incrementSlabs: [
      { minPrice: 1, maxPrice: 49999, increment: 1000 },
      { minPrice: 50000, maxPrice: 99999, increment: 2500 },
      { minPrice: 100000, maxPrice: 199999, increment: 5000 },
      { minPrice: 200000, maxPrice: 10000000, increment: 10000 }
    ]
  },
  {
    title: 'Ancient Roman Silver Denarius Set',
    description: 'Collection of 10 authentic Roman silver denarius coins dating back to 100-200 AD. Each coin features portraits of Roman emperors. Complete with certificates of authenticity.',
    image: 'https://images.unsplash.com/photo-1621339571892-0ec0b16ec203?w=800',
    startingPrice: 15000,
    reservePrice: 45000,
    startTime: new Date(Date.now() + 15 * 60 * 1000), // Starts in 15 minutes
    endTime: new Date(Date.now() + 75 * 60 * 1000), // Ends in 75 minutes
    isGoingGoingGoneEnabled: true,
    incrementSlabs: [
      { minPrice: 1, maxPrice: 19999, increment: 500 },
      { minPrice: 20000, maxPrice: 49999, increment: 1000 },
      { minPrice: 50000, maxPrice: 99999, increment: 2500 },
      { minPrice: 100000, maxPrice: 10000000, increment: 5000 }
    ]
  }
];

const seedAuctions = async () => {
  try {
    // Connect to MongoDB (support both MONGO_URI and MONGODB_URI)
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables. Please set MONGO_URI or MONGODB_URI.');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('🗄️  Connected to MongoDB');

    // Clear existing auctions (optional - comment out if you want to keep existing data)
    // await Auction.deleteMany({ title: { $in: sampleAuctions.map(a => a.title) } });
    // console.log('🗑️  Cleared existing sample auctions');

    // Create sample auctions
    const createdAuctions = await Auction.insertMany(sampleAuctions);

    console.log('\n✅ Successfully created sample auctions:');
    createdAuctions.forEach((auction, index) => {
      const status = new Date() < new Date(auction.startTime) ? 'Upcoming' :
                     new Date() >= new Date(auction.startTime) && new Date() < new Date(auction.endTime) ? 'Active' : 'Ended';

      console.log(`\n${index + 1}. ${auction.title}`);
      console.log(`   Starting Price: ₹${auction.startingPrice.toLocaleString()}`);
      console.log(`   Reserve Price: ₹${auction.reservePrice.toLocaleString()}`);
      console.log(`   Status: ${status}`);
      console.log(`   Start Time: ${new Date(auction.startTime).toLocaleTimeString()}`);
      console.log(`   End Time: ${new Date(auction.endTime).toLocaleTimeString()}`);
      console.log(`   Going, Going, Gone: ${auction.isGoingGoingGoneEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    });

    console.log('\n\n🎯 TESTING TIPS:');
    console.log('1. The "Blue Diamond" auction starts in 1 minute - perfect for immediate testing!');
    console.log('2. Place a bid and wait 30 seconds without bidding to see "GOING ONCE!" warning');
    console.log('3. Wait another 30 seconds to see "GOING TWICE!" warning');
    console.log('4. Wait another 30 seconds to see "SOLD!" and automatic auction closure');
    console.log('5. Place a new bid at any time to reset the timer');
    console.log('\n💡 Make sure your Socket.io server is running for real-time updates!');

    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding auctions:', error);
    process.exit(1);
  }
};

// Run the seeder
seedAuctions();
