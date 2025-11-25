import Auction from '../models/Auction.js';
import { endCurrentLot } from '../controllers/auctionController.js';

let io = null;
let timerInterval = null;

// Initialize the timer service with socket.io instance
export const initLotTimerService = (socketIo) => {
  io = socketIo;

  // Check every 10 seconds for expired lots
  timerInterval = setInterval(async () => {
    await checkExpiredLots();
  }, 10000); // 10 seconds

  console.log('⏰ Lot Timer Service started - checking every 10 seconds');
};

// Check for expired lots and end them
const checkExpiredLots = async () => {
  try {
    const now = new Date();

    // Find all active lot bidding auctions
    const activeAuctions = await Auction.find({
      isLotBidding: true,
      status: 'Active'
    });

    for (const auction of activeAuctions) {
      // Check if current lot has expired
      if (auction.currentLotEndTime && new Date(auction.currentLotEndTime) <= now) {
        const currentLotIndex = (auction.lotNumber || 1) - 1;
        const currentLot = auction.lots[currentLotIndex];

        // Only end if lot is still Active (not already processed)
        if (currentLot && currentLot.status === 'Active') {
          console.log(`⏰ LOT ${auction.lotNumber} EXPIRED for auction ${auction._id} - Ending now`);

          try {
            await endCurrentLot(auction._id, io);
            console.log(`✅ Successfully ended expired lot ${auction.lotNumber}`);
          } catch (error) {
            console.error(`❌ Error ending lot ${auction.lotNumber}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking expired lots:', error);
  }
};

// Stop the timer service
export const stopLotTimerService = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('⏰ Lot Timer Service stopped');
  }
};
