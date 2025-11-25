import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Auction from '../models/Auction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fixLotStatus = async () => {
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

    // Find all active lot bidding auctions with first lot as Upcoming
    const auctions = await Auction.find({
      isLotBidding: true,
      status: 'Active',
      'lots.0.status': 'Upcoming'
    });

    console.log(`\n📊 Found ${auctions.length} auctions with inactive first lot\n`);

    for (const auction of auctions) {
      const firstLot = auction.lots[0];
      const now = new Date();

      // Activate first lot
      firstLot.status = 'Active';
      firstLot.startTime = now;
      firstLot.endTime = new Date(now.getTime() + (auction.lotDuration || 10) * 60 * 1000);

      // Set current lot times
      auction.currentLotStartTime = now;
      auction.currentLotEndTime = firstLot.endTime;
      auction.lotNumber = 1;

      await auction.save();

      console.log(`✅ Fixed auction: ${auction.title}`);
      console.log(`   - Lot 1 status: ${firstLot.status}`);
      console.log(`   - Lot 1 ends at: ${firstLot.endTime.toLocaleString()}\n`);
    }

    console.log('✅ All auctions fixed!\n');

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error fixing lot status:', error);
    process.exit(1);
  }
};

fixLotStatus();
