import Auction from '../models/Auction.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AuctionInvoice from '../models/AuctionInvoice.js';

// ============================================
// HELPER FUNCTIONS FOR PER-LOT COIN MANAGEMENT
// ============================================

/**
 * Freeze coins for a specific lot in an auction (REAL-TIME DEDUCTION)
 * @param {String} userId - User's ObjectId
 * @param {String} auctionId - Auction's ObjectId
 * @param {Number} lotNumber - Lot number
 * @param {Number} amount - Amount to deduct
 */
export const freezeCoinsForLot = async (userId, auctionId, lotNumber, amount) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has enough auction coins (real-time check)
    if (user.auctionCoins < amount) {
      throw new Error('Insufficient auction coins');
    }

    // Check if user already has frozen coins for this auction+lot
    const existingFrozen = user.frozenCoinsPerAuction.find(
      f => f.auctionId.toString() === auctionId.toString() && f.lotNumber === lotNumber
    );

    if (existingFrozen) {
      // User is updating their bid on the same lot
      const difference = amount - existingFrozen.amount;

      // Adjust auction coins based on difference
      user.auctionCoins -= difference;
      existingFrozen.amount = amount;
      user.frozenCoins += difference;
    } else {
      // New bid - deduct coins immediately (REAL-TIME)
      user.auctionCoins -= amount;

      // Track frozen amount for this lot
      user.frozenCoinsPerAuction.push({
        auctionId,
        lotNumber,
        amount
      });
      user.frozenCoins += amount;
    }

    await user.save();
    return { success: true, user };
  } catch (error) {
    console.error('Error freezing coins for lot:', error);
    throw error;
  }
};

/**
 * Unfreeze coins for a specific lot in an auction (REAL-TIME REFUND)
 * @param {String} userId - User's ObjectId
 * @param {String} auctionId - Auction's ObjectId
 * @param {Number} lotNumber - Lot number
 */
export const unfreezeCoinsForLot = async (userId, auctionId, lotNumber) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Find frozen coins for this auction+lot
    const frozenIndex = user.frozenCoinsPerAuction.findIndex(
      f => f.auctionId.toString() === auctionId.toString() && f.lotNumber === lotNumber
    );

    if (frozenIndex !== -1) {
      const frozenAmount = user.frozenCoinsPerAuction[frozenIndex].amount;

      // Return coins immediately (REAL-TIME REFUND)
      user.auctionCoins += frozenAmount;

      // Remove from frozenCoinsPerAuction array
      user.frozenCoinsPerAuction.splice(frozenIndex, 1);

      // Decrease total frozen coins
      user.frozenCoins = Math.max(0, user.frozenCoins - frozenAmount);

      await user.save();
      return { success: true, unfrozenAmount: frozenAmount, user };
    }

    return { success: true, unfrozenAmount: 0, user };
  } catch (error) {
    console.error('Error unfreezing coins for lot:', error);
    throw error;
  }
};

/**
 * Confirm frozen coins as spent when lot is WON
 * Coins were already deducted during bidding, so just clear frozen tracking
 * @param {String} userId - User's ObjectId
 * @param {String} auctionId - Auction's ObjectId
 * @param {Number} lotNumber - Lot number
 * @param {Number} amount - Amount that was already deducted
 */
export const deductFrozenCoins = async (userId, auctionId, lotNumber, amount) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Find frozen coins for this auction+lot
    const frozenIndex = user.frozenCoinsPerAuction.findIndex(
      f => f.auctionId.toString() === auctionId.toString() && f.lotNumber === lotNumber
    );

    if (frozenIndex !== -1) {
      const frozenAmount = user.frozenCoinsPerAuction[frozenIndex].amount;

      // Remove from frozenCoinsPerAuction array
      user.frozenCoinsPerAuction.splice(frozenIndex, 1);

      // Decrease frozen coins (coins already deducted from auctionCoins during bidding)
      user.frozenCoins = Math.max(0, user.frozenCoins - frozenAmount);

      await user.save();
      return { success: true, deductedAmount: frozenAmount, user };
    }

    // If no frozen coins found, deduct directly from auction coins (fallback)
    if (user.auctionCoins >= amount) {
      user.auctionCoins -= amount;
      await user.save();
      return { success: true, deductedAmount: amount, user };
    } else {
      throw new Error('Insufficient auction coins');
    }
  } catch (error) {
    console.error('Error confirming frozen coins as spent:', error);
    throw error;
  }
};

// Indian state codes mapping for invoice generation
const STATE_CODES = {
  'Andhra Pradesh': '37',
  'Arunachal Pradesh': '12',
  'Assam': '18',
  'Bihar': '10',
  'Chhattisgarh': '22',
  'Goa': '30',
  'Gujarat': '24',
  'Haryana': '06',
  'Himachal Pradesh': '02',
  'Jharkhand': '20',
  'Karnataka': '29',
  'Kerala': '32',
  'Madhya Pradesh': '23',
  'Maharashtra': '27',
  'Manipur': '14',
  'Meghalaya': '17',
  'Mizoram': '15',
  'Nagaland': '13',
  'Odisha': '21',
  'Punjab': '03',
  'Rajasthan': '08',
  'Sikkim': '11',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Tripura': '16',
  'Uttar Pradesh': '09',
  'Uttarakhand': '05',
  'West Bengal': '19',
  'Delhi': '07',
  'Jammu and Kashmir': '01',
  'Ladakh': '38',
  'Puducherry': '34',
  'Chandigarh': '04',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Lakshadweep': '31',
  'Andaman and Nicobar Islands': '35'
};

/**
 * Automatically generate or update invoice for a sold lot
 * One invoice per buyer per auction (consolidates all lots won by same buyer)
 * @param {String} auctionId - Auction's ObjectId
 * @param {Number} lotNumber - Lot number
 * @param {Object} lot - Lot object
 * @param {String} winnerId - Winner's ObjectId
 */
export const autoGenerateInvoice = async (auctionId, lotNumber, lot, winnerId) => {
  try {
    console.log(`📄 Processing invoice for auction ${auctionId}, lot ${lotNumber}, buyer ${winnerId}`);

    // Get buyer details
    const buyer = await User.findById(winnerId);
    if (!buyer) {
      console.error(`❌ Buyer not found for invoice generation: ${winnerId}`);
      return { success: false, message: 'Buyer not found' };
    }

    // Check if invoice already exists for this auction+buyer
    let invoice = await AuctionInvoice.findOne({
      auction: auctionId,
      buyer: winnerId
    });

    const newLot = {
      lotNumber,
      description: lot.title,
      detailedDescription: lot.description,
      hsnCode: '97050090',
      quantity: 1,
      hammerPrice: lot.currentBid
    };

    if (invoice) {
      // Invoice exists - add this lot to the existing invoice
      console.log(`📝 Adding lot ${lotNumber} to existing invoice ${invoice.invoiceNumber}`);

      invoice.lotNumbers.push(lotNumber);
      invoice.lots.push(newLot);
      await invoice.save(); // Pre-save hook will recalculate totals

      console.log(`✅ Lot ${lotNumber} added to invoice ${invoice.invoiceNumber}`);
      return { success: true, invoice, updated: true };
    } else {
      // No invoice exists - create new one
      console.log(`📄 Creating new invoice for auction ${auctionId}, buyer ${buyer.name}`);

      // Determine billing address state code
      const buyerState = buyer.address?.state || 'Maharashtra';
      const buyerStateCode = STATE_CODES[buyerState] || '27';

      // Company details (default for Chronicle Vaults)
      const defaultCompanyDetails = {
        name: 'Chronicle Vaults',
        gstin: '27XXXXX0000X1ZX',
        pan: 'XXXXX0000X',
        msme: 'MH-XX-XXXXXXX',
        address: 'Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        phone: '+91-XXXXXXXXXX',
        email: 'info@chroniclevaults.com',
        bankDetails: {
          bankName: 'Bank Name',
          accountNumber: 'XXXXXXXXXXXX',
          ifsc: 'XXXXXX',
          branch: 'Mumbai'
        }
      };

      // Determine GST type (IGST for interstate, CGST+SGST for intrastate)
      const isInterstate = buyerStateCode !== defaultCompanyDetails.stateCode;
      const gstType = isInterstate ? 'IGST' : 'CGST+SGST';

      // Create invoice with first lot
      invoice = await AuctionInvoice.create({
        auction: auctionId,
        lotNumbers: [lotNumber],
        buyer: buyer._id,
        buyerDetails: {
          name: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
          gstin: buyer.gstin || '',
          pan: buyer.pan || '',
          buyerNumber: `BUY${buyer._id.toString().slice(-3).toUpperCase()}`
        },
        billingAddress: {
          street: buyer.address?.street || '',
          city: buyer.address?.city || '',
          state: buyerState,
          stateCode: buyerStateCode,
          zipCode: buyer.address?.zipCode || ''
        },
        shippingAddress: {
          street: buyer.address?.street || '',
          city: buyer.address?.city || '',
          state: buyerState,
          stateCode: buyerStateCode,
          zipCode: buyer.address?.zipCode || ''
        },
        lots: [newLot],
        packingForwardingCharges: {
          amount: 80,
          hsnCode: '99854'
        },
        insuranceCharges: {
          amount: 0,
          hsnCode: '99681',
          declined: true
        },
        gst: {
          type: gstType,
          rate: 5.00,
          itemGSTRate: 5.00,
          packingGSTRate: 18.00
        },
        shipping: {
          transportMode: 'Post/Courier',
          placeOfSupply: buyerState
        },
        companyDetails: defaultCompanyDetails,
        status: 'Generated'
      });

      console.log(`✅ Invoice ${invoice.invoiceNumber} created for lot ${lotNumber}`);
      return { success: true, invoice, updated: false };
    }
  } catch (error) {
    console.error(`❌ Error auto-generating invoice for lot ${lotNumber}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * End the current lot and determine if it's SOLD or UNSOLD
 * @param {String} auctionId - Auction's ObjectId
 * @param {Object} io - Socket.io instance
 */
export const endCurrentLot = async (auctionId, io) => {
  try {
    const auction = await Auction.findById(auctionId);

    if (!auction || !auction.isLotBidding) {
      throw new Error('Not a valid lot bidding auction');
    }

    const currentLotIndex = (auction.lotNumber || 1) - 1;
    if (!auction.lots || !auction.lots[currentLotIndex]) {
      throw new Error('Current lot not found');
    }

    const currentLot = auction.lots[currentLotIndex];
    const lotNumber = currentLot.lotNumber;

    // CRITICAL: Check if lot already ended (prevent duplicate calls)
    if (currentLot.status === 'Sold' || currentLot.status === 'Unsold' || currentLot.status === 'Ended') {
      console.log(`⚠️  LOT ${lotNumber} already ended (${currentLot.status}), skipping duplicate endCurrentLot call`);
      return { success: false, message: 'Lot already ended' };
    }

    // NOW increment generation and clear timers (only for valid lot ends) - LOT-BASED
    const timerKey = getTimerKey(auctionId, lotNumber);
    const newGen = (timerGeneration.get(timerKey) || 0) + 1;
    timerGeneration.set(timerKey, newGen);

    const existingTimer = auctionTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer.timerId);
      console.log(`🧹 [endCurrentLot] Cleared timer for ${timerKey}, gen ${existingTimer.generation}, new gen: ${newGen}`);
    }
    auctionTimers.delete(timerKey);

    console.log(`\n🏁 Ending LOT ${lotNumber} of Auction ${auctionId}`);

    // Check if lot has bids
    if (!currentLot.bids || currentLot.bids.length === 0) {
      // NO BIDS - Mark as UNSOLD
      currentLot.status = 'Unsold';
      currentLot.unsoldReason = 'No bids';
      currentLot.endTime = new Date();

      console.log(`❌ LOT ${lotNumber} UNSOLD - No bids received`);

      // Emit final announcement and socket event
      if (io) {
        // Emit UNSOLD announcement
        io.to(`auction-${auctionId}`).emit('auction-warning', {
          auctionId: auctionId.toString(),
          message: 'UNSOLD! ❌ (No bids received)',
          warning: 3,
          final: true,
          lotNumber
        });

        // Emit lot-unsold event
        io.to(`auction-${auctionId}`).emit('lot-unsold', {
          auctionId,
          lotNumber,
          reason: 'No bids',
          nextLotNumber: auction.lotNumber + 1 <= auction.totalLots ? auction.lotNumber + 1 : null
        });
      }
    } else {
      // Has bids - check if winner's bid meets reserve price
      const sortedBids = [...currentLot.bids].sort((a, b) => b.amount - a.amount);
      const winningBid = sortedBids[0];
      const reservePrice = currentLot.reservePrice || 0;

      if (winningBid.amount < reservePrice) {
        // BELOW RESERVE PRICE - Mark as UNSOLD
        currentLot.status = 'Unsold';
        currentLot.unsoldReason = 'Below reserve price';
        currentLot.endTime = new Date();

        console.log(`❌ LOT ${lotNumber} UNSOLD - Winning bid ₹${winningBid.amount} below reserve ₹${reservePrice}`);

        // Unfreeze all bidders' coins for this lot
        for (const bid of currentLot.bids) {
          const unfreezeResult = await unfreezeCoinsForLot(bid.user, auctionId, lotNumber);
          console.log(`🔓 Unfroze coins for bidder ${bid.user} on UNSOLD lot ${lotNumber}`);

          // REAL-TIME: Emit coin balance update to each user individually
          if (io && unfreezeResult.success && unfreezeResult.user) {
            io.to(`user-${bid.user.toString()}`).emit('coin-balance-updated', {
              auctionCoins: unfreezeResult.user.auctionCoins,
              frozenCoins: unfreezeResult.user.frozenCoins,
              reason: 'Lot unsold - coins refunded',
              lotNumber,
              auctionId: auctionId.toString()
            });
            console.log(`💰 Sent real-time coin update to user ${bid.user}: ${unfreezeResult.user.auctionCoins} coins`);
          }
        }

        // Emit final announcement and socket event
        if (io) {
          // Emit UNSOLD announcement
          io.to(`auction-${auctionId}`).emit('auction-warning', {
            auctionId: auctionId.toString(),
            message: 'UNSOLD! ❌ (Below reserve)',
            warning: 3,
            final: true,
            lotNumber
          });

          // Emit lot-unsold event
          io.to(`auction-${auctionId}`).emit('lot-unsold', {
            auctionId,
            lotNumber,
            reason: 'Below reserve price',
            winningBid: winningBid.amount,
            reservePrice,
            nextLotNumber: auction.lotNumber + 1 <= auction.totalLots ? auction.lotNumber + 1 : null
          });
        }
      } else {
        // SOLD - Winner pays, losers get unfrozen
        currentLot.status = 'Sold';
        currentLot.winner = winningBid.user;
        currentLot.endTime = new Date();

        console.log(`✅ LOT ${lotNumber} SOLD to user ${winningBid.user} for ₹${winningBid.amount}`);

        // Deduct winner's frozen coins
        await deductFrozenCoins(winningBid.user, auctionId, lotNumber, winningBid.amount);
        console.log(`💰 Deducted ₹${winningBid.amount} from winner ${winningBid.user}`);

        // Unfreeze all other bidders' coins
        for (const bid of currentLot.bids) {
          if (bid.user.toString() !== winningBid.user.toString()) {
            const unfreezeResult = await unfreezeCoinsForLot(bid.user, auctionId, lotNumber);
            console.log(`🔓 Unfroze coins for non-winner ${bid.user} on lot ${lotNumber}`);

            // REAL-TIME: Emit coin balance update to each non-winner
            if (io && unfreezeResult.success && unfreezeResult.user) {
              io.to(`user-${bid.user.toString()}`).emit('coin-balance-updated', {
                auctionCoins: unfreezeResult.user.auctionCoins,
                frozenCoins: unfreezeResult.user.frozenCoins,
                reason: 'Lot sold to another bidder - coins refunded',
                lotNumber,
                auctionId: auctionId.toString()
              });
              console.log(`💰 Sent real-time coin update to non-winner ${bid.user}: ${unfreezeResult.user.auctionCoins} coins`);
            }
          }
        }

        // Auto-generate invoice for sold lot
        await autoGenerateInvoice(auctionId, lotNumber, currentLot, winningBid.user);

        // Emit final announcement and socket event
        if (io) {
          // Emit SOLD announcement
          io.to(`auction-${auctionId}`).emit('auction-warning', {
            auctionId: auctionId.toString(),
            message: 'SOLD! 🎉',
            warning: 3,
            final: true,
            lotNumber,
            finalPrice: winningBid.amount
          });

          // Emit lot-sold event
          io.to(`auction-${auctionId}`).emit('lot-sold', {
            auctionId,
            lotNumber,
            winner: winningBid.user,
            finalPrice: winningBid.amount,
            nextLotNumber: auction.lotNumber + 1 <= auction.totalLots ? auction.lotNumber + 1 : null
          });
        }
      }
    }

    // Move to next lot or end auction
    if (auction.lotNumber < auction.totalLots) {
      // Start next lot
      const nextLotIndex = auction.lotNumber; // Current lotNumber is 1-indexed
      auction.lotNumber += 1;

      if (auction.lots[nextLotIndex]) {
        auction.lots[nextLotIndex].status = 'Active';
        auction.lots[nextLotIndex].startTime = new Date(Date.now() + 3000); // 3-second pause

        // Update main auction currentBid to new lot's starting price
        auction.currentBid = auction.lots[nextLotIndex].currentBid || auction.lots[nextLotIndex].startingPrice;

        // Reset timer for new lot
        auction.callNumber = 1;
        auction.phaseTimer = 10;
        auction.phaseStartTime = null;
        auction.lastBidTime = null;
        auction.currentLotStartTime = new Date(Date.now() + 3000);

        console.log(`🚀 Starting LOT ${auction.lotNumber} in 3 seconds`);

        // Emit socket event for lot start IMMEDIATELY (to dismiss overlays)
        if (io) {
          io.to(`auction-${auctionId}`).emit('lot-started', {
            auctionId,
            lotNumber: auction.lotNumber,
            lot: auction.lots[nextLotIndex],
            currentLotStartTime: auction.currentLotStartTime, // CRITICAL: Send this so frontend can show 60s timer
            lastBidTime: auction.lastBidTime // Should be null for new lot
          });

          // Capture the generation for timer callback
          const capturedGen = newGen;

          // Start timer after 3-second pause
          setTimeout(async () => {
            // CRITICAL: Check if this callback is still valid (not superseded by newer lot switch)
            const currentGen = timerGeneration.get(auctionId);
            if (currentGen !== capturedGen) {
              console.log(`⚠️  [GEN ${capturedGen}] Lot start callback superseded by gen ${currentGen}, skipping timer start`);
              return;
            }

            // Restart 3-phase timer for new lot
            if (auction.isThreePhaseTimerEnabled) {
              startThreePhaseTimer(auctionId, io);
              console.log(`⏰ [GEN ${capturedGen}] Started 3-phase timer for newly activated Lot ${auction.lotNumber}`);
            }
          }, 3000);
        }
      }
    } else {
      // All lots completed - end auction
      auction.status = 'Ended';
      auction.endTime = new Date();

      console.log(`🎉 AUCTION ${auctionId} COMPLETED - All ${auction.totalLots} lots processed`);

      // Emit socket event for auction completion
      if (io) {
        io.to(`auction-${auctionId}`).emit('auction-completed', {
          auctionId,
          totalLots: auction.totalLots
        });
      }
    }

    await auction.save();
    return { success: true, auction };
  } catch (error) {
    console.error('Error ending current lot:', error);
    throw error;
  }
};

// Global timer tracking for Going, Going, Gone feature - LOT-BASED SYSTEM
const auctionTimers = new Map(); // Stores { timerId, generation } with key: "auctionId-L1", "auctionId-L2", etc.
const timerGeneration = new Map(); // Track timer generation per lot to invalidate old callbacks

// Helper: Generate lot-specific timer key
const getTimerKey = (auctionId, lotNumber) => {
  return `${auctionId}-L${lotNumber}`;
};

// Start 3-Phase Timer (30 seconds total: 10s per phase)
export const startThreePhaseTimer = async (auctionId, io) => {
  // Fetch auction to get current lot number
  const auction = await Auction.findById(auctionId);
  if (!auction || !auction.isLotBidding) {
    console.log(`⚠️  Cannot start timer: Invalid auction or not lot bidding`);
    return;
  }

  const lotNumber = auction.lotNumber || 1;
  const timerKey = getTimerKey(auctionId, lotNumber);

  // Increment generation for THIS LOT to invalidate old timers
  const currentGen = (timerGeneration.get(timerKey) || 0) + 1;
  timerGeneration.set(timerKey, currentGen);

  // Clear existing timer if any for THIS LOT
  const existingTimer = auctionTimers.get(timerKey);
  if (existingTimer) {
    clearTimeout(existingTimer.timerId);
    console.log(`🧹 Cleared existing timer (gen ${existingTimer.generation}) for ${timerKey}`);
  }

  // Initialize phase if not set
  if (!auction.callNumber) {
    auction.callNumber = 1;
  }
  if (!auction.phaseStartTime) {
    auction.phaseStartTime = new Date();
  }
  if (auction.phaseTimer === undefined) {
    auction.phaseTimer = 10;
  }
  await auction.save();

  const tickPhase = async () => {
    // Check if this callback is still valid
    const currentActiveGen = timerGeneration.get(timerKey);
    if (currentActiveGen !== currentGen) {
      console.log(`⚠️  Timer callback gen ${currentGen} superseded by gen ${currentActiveGen} for ${timerKey}`);
      return;
    }

    try {
      const auction = await Auction.findById(auctionId);

      if (!auction || auction.status !== 'Active' || !auction.isThreePhaseTimerEnabled) {
        console.log(`⏹️  Auction ${auctionId} ended or timer disabled, stopping timer for ${timerKey}`);
        auctionTimers.delete(timerKey);
        timerGeneration.delete(timerKey);
        return;
      }

      // Verify we're still on the same lot
      const currentLotNum = auction.lotNumber || 1;
      if (currentLotNum !== lotNumber) {
        console.log(`⚠️  Lot changed from ${lotNumber} to ${currentLotNum}, stopping timer for ${timerKey}`);
        auctionTimers.delete(timerKey);
        timerGeneration.delete(timerKey);
        return;
      }

      const now = new Date();
      const phaseStartTime = new Date(auction.phaseStartTime);
      const elapsedSeconds = Math.floor((now - phaseStartTime) / 1000);
      const remainingSeconds = Math.max(0, 10 - elapsedSeconds);

      // Update phaseTimer
      auction.phaseTimer = remainingSeconds;

      // Emit timer update
      const phaseMessages = {
        1: 'Going Once',
        2: 'Going Twice',
        3: auction.lots[currentLotNum - 1]?.bids?.length > 0 ? 'SOLD' : 'UNSOLD'
      };

      io.to(`auction-${auctionId}`).emit('auction-phase-tick', {
        auctionId: auctionId.toString(),
        callNumber: auction.callNumber,
        phaseTimer: remainingSeconds,
        phaseMessage: phaseMessages[auction.callNumber]
      });

      console.log(`⏱️  [${timerKey}] Phase ${auction.callNumber}: ${remainingSeconds}s remaining`);

      // Check if phase is complete
      if (remainingSeconds <= 0) {
        // Phase completed, move to next phase
        if (auction.callNumber < 3) {
          // Move to next phase
          auction.callNumber++;
          auction.phaseTimer = 10;
          auction.phaseStartTime = new Date();
          await auction.save();

          console.log(`🔄 [${timerKey}] Moving to Phase ${auction.callNumber}`);

          // Continue ticking
          const timerId = setTimeout(tickPhase, 1000);
          auctionTimers.set(timerKey, { timerId, generation: currentGen });
        } else {
          // Phase 3 complete - end lot
          console.log(`🎯 [${timerKey}] Phase 3 complete - ending lot`);

          if (auction.isLotBidding) {
            await endCurrentLot(auctionId, io);
          } else {
            auction.status = 'Ended';
            await auction.updateStatus();
            await auction.save();
          }

          // Clear timer
          auctionTimers.delete(timerKey);
          timerGeneration.delete(timerKey);
        }
      } else {
        await auction.save();

        // Continue ticking every second
        const timerId = setTimeout(tickPhase, 1000);
        auctionTimers.set(timerKey, { timerId, generation: currentGen });
      }
    } catch (error) {
      console.error(`Three-phase timer error for ${timerKey}:`, error);
      auctionTimers.delete(timerKey);
      timerGeneration.delete(timerKey);
    }
  };

  // Start the timer
  const timerId = setTimeout(tickPhase, 1000);
  auctionTimers.set(timerKey, { timerId, generation: currentGen });
  console.log(`⏰ [${timerKey}] [GEN ${currentGen}] Started 3-phase timer (Phase ${auction.callNumber})`);
};

// Reset phase timer when new bid is placed (stays in same phase)
export const resetPhaseTimer = async (auctionId, io) => {
  try {
    const auction = await Auction.findById(auctionId);

    if (auction && auction.isThreePhaseTimerEnabled && auction.isLotBidding) {
      const lotNumber = auction.lotNumber || 1;
      const timerKey = getTimerKey(auctionId, lotNumber);

      // Get current generation before clearing
      const oldGen = timerGeneration.get(timerKey) || 0;

      // Clear existing timer
      const existingTimer = auctionTimers.get(timerKey);
      if (existingTimer) {
        clearTimeout(existingTimer.timerId);
        console.log(`🧹 [${timerKey}] [GEN ${oldGen}] Cleared existing timer for phase reset`);
      }

      // Reset phase timer to 10 seconds (stay in same phase)
      auction.phaseTimer = 10;
      auction.phaseStartTime = new Date();
      auction.lastBidTime = new Date();
      await auction.save();

      // Emit reset event
      io.to(`auction-${auctionId}`).emit('auction-phase-reset', {
        auctionId: auctionId.toString(),
        callNumber: auction.callNumber,
        phaseTimer: 10,
        message: 'New bid! Phase timer reset to 10 seconds.'
      });

      console.log(`🔄 [${timerKey}] Phase ${auction.callNumber} timer reset to 10 seconds`);

      // Restart timer (this will increment generation)
      await startThreePhaseTimer(auctionId, io);
      const newGen = timerGeneration.get(timerKey);
      console.log(`🔄 [${timerKey}] Resumed timer: gen ${oldGen} → ${newGen}`);
    }
  } catch (error) {
    console.error('Reset phase timer error:', error);
  }
};

// Start next lot in sequence when current lot ends
export const startNextLot = async (auctionId, io) => {
  try {
    const auction = await Auction.findById(auctionId);

    if (!auction || !auction.isLotBidding) {
      return;
    }

    const currentLotNum = auction.lotNumber || 1;
    const nextLotNum = currentLotNum + 1;

    console.log(`📦 Lot ${currentLotNum} ended for auction ${auctionId}`);

    // Mark current lot as Ended
    if (auction.lots && auction.lots[currentLotNum - 1]) {
      auction.lots[currentLotNum - 1].status = 'Ended';
      auction.lots[currentLotNum - 1].endTime = new Date();

      // Set winner for current lot
      if (auction.lots[currentLotNum - 1].bids.length > 0) {
        const lastBid = auction.lots[currentLotNum - 1].bids[auction.lots[currentLotNum - 1].bids.length - 1];
        auction.lots[currentLotNum - 1].winner = lastBid.user;
      }
    }

    // Check if there are more lots
    if (nextLotNum <= auction.totalLots && auction.lots[nextLotNum - 1]) {
      // Start next lot
      auction.lotNumber = nextLotNum;
      auction.lots[nextLotNum - 1].status = 'Active';
      auction.lots[nextLotNum - 1].startTime = new Date();
      // endTime removed - lot ends based on bidding activity via Going Gone timer

      auction.currentLotStartTime = auction.lots[nextLotNum - 1].startTime;
      // currentLotEndTime removed - lot ends based on bidding activity

      // Update main auction fields to reflect current lot
      auction.currentBid = auction.lots[nextLotNum - 1].currentBid;
      auction.callNumber = 1;
      auction.phaseTimer = 10;
      auction.phaseStartTime = null;
      auction.lastBidTime = null;

      await auction.save();

      console.log(`🎬 Lot ${nextLotNum} started for auction ${auctionId}`);

      // Emit socket event for lot change
      io.to(`auction-${auctionId}`).emit('lot-changed', {
        auctionId: auctionId.toString(),
        previousLot: currentLotNum,
        currentLot: nextLotNum,
        lotData: auction.lots[nextLotNum - 1],
        message: `Lot ${nextLotNum} has started!`
      });

      // NOTE: Timer is started in endCurrentLot after 3-second delay

    } else {
      // All lots completed - end entire auction
      auction.status = 'Ended';
      await auction.save();

      console.log(`🏁 All lots completed for auction ${auctionId}`);

      io.to(`auction-${auctionId}`).emit('auction-completed', {
        auctionId: auctionId.toString(),
        message: 'All lots have been completed!'
      });
    }
  } catch (error) {
    console.error('Start next lot error:', error);
  }
};

// @desc    Get all auctions
// @route   GET /api/auctions
// @access  Public
export const getAllAuctions = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const auctions = await Auction.find(query)
      .populate('product', 'name price images')
      .populate('winner', 'name email phone')
      .populate('reserveBidder', 'name email phone')
      .populate('bids.user', 'name email')
      .sort({ createdAt: -1 });

    // Update status for all auctions based on current time
    for (let auction of auctions) {
      await auction.updateStatus();
      await auction.save();
    }

    res.json({
      success: true,
      data: auctions
    });
  } catch (error) {
    console.error('Get all auctions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions',
      error: error.message
    });
  }
};

// @desc    Get auction by ID
// @route   GET /api/auctions/:id
// @access  Public
export const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('product', 'name price images description')
      .populate('winner', 'name email phone')
      .populate('reserveBidder', 'name email phone')
      .populate('bids.user', 'name email');

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Update status based on current time
    await auction.updateStatus();
    await auction.save();

    // Start 3-phase timer if auction is active (LOT-BASED ONLY)
    const io = req.app.get('io');
    if (io && auction.status === 'Active' && auction.isThreePhaseTimerEnabled && auction.isLotBidding) {
      const lotNumber = auction.lotNumber || 1;
      const timerKey = getTimerKey(auction._id.toString(), lotNumber);
      if (!auctionTimers.has(timerKey)) {
        startThreePhaseTimer(auction._id, io);
      }
    }

    res.json({
      success: true,
      data: auction
    });
  } catch (error) {
    console.error('Get auction by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction',
      error: error.message
    });
  }
};

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Admin
export const createAuction = async (req, res) => {
  try {
    const {
      productId,
      title,
      description,
      image,
      startingPrice,
      reservePrice,
      reserveBidder,
      incrementSlabs,
      startTime,
      endTime,
      isLotBidding,
      lots,
      totalLots,
      lotDuration,
      isThreePhaseTimerEnabled
    } = req.body;

    // Validate product exists (if productId is provided and valid)
    let product = null;
    // Check if productId is provided and is a valid ObjectId
    const isValidProductId = productId && productId.trim() !== '' && productId.length === 24;

    if (isValidProductId) {
      try {
        product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Product ID format'
        });
      }
    }

    // Image is required if no product is linked (unless it's lot bidding where each lot has its own image)
    if (!image && !product && !isLotBidding) {
      return res.status(400).json({
        success: false,
        message: 'Image is required for standalone auctions'
      });
    }

    // Default increment slabs if not provided (based on conversation requirements)
    const defaultSlabs = incrementSlabs || [
      { minPrice: 1, maxPrice: 1999, increment: 100 },
      { minPrice: 2000, maxPrice: 2999, increment: 200 },
      { minPrice: 3000, maxPrice: 4999, increment: 300 },
      { minPrice: 5000, maxPrice: 9999, increment: 500 },
      { minPrice: 10000, maxPrice: 19999, increment: 1000 },
      { minPrice: 20000, maxPrice: 29999, increment: 2000 },
      { minPrice: 30000, maxPrice: 49999, increment: 3000 },
      { minPrice: 50000, maxPrice: 99999, increment: 5000 },
      { minPrice: 100000, maxPrice: 199999, increment: 10000 },
      { minPrice: 200000, maxPrice: 299999, increment: 20000 },
      { minPrice: 300000, maxPrice: 499999, increment: 30000 },
      { minPrice: 500000, maxPrice: 999999, increment: 50000 },
      { minPrice: 1000000, maxPrice: 1999999, increment: 100000 },
      { minPrice: 2000000, maxPrice: 2999999, increment: 200000 },
      { minPrice: 3000000, maxPrice: 4999999, increment: 300000 },
      { minPrice: 5000000, maxPrice: 10000000, increment: 500000 }
    ];

    // Create auction object
    const auctionData = {
      product: isValidProductId ? productId : null,
      title,
      description,
      image: image || (product ? product.images[0] : null),
      startingPrice,
      currentBid: startingPrice,
      reservePrice,
      reserveBidder: reserveBidder && reserveBidder.trim() !== '' ? reserveBidder : null,
      incrementSlabs: defaultSlabs,
      startTime: new Date(startTime),
      // endTime removed - auction duration is now based on bidding activity via 3-phase timer
      isThreePhaseTimerEnabled: isThreePhaseTimerEnabled !== undefined ? isThreePhaseTimerEnabled : true
    };

    // If lot bidding, add lot-specific fields
    if (isLotBidding && lots && lots.length > 0) {
      auctionData.isLotBidding = true;
      auctionData.totalLots = lots.length;
      auctionData.lotNumber = 1; // Start with first lot
      auctionData.lotDuration = lotDuration || 10; // Default 10 minutes per lot

      // Process lots - set first lot as Active/Upcoming based on startTime
      const now = new Date();
      const auctionStart = new Date(startTime);
      const isAuctionStarted = now >= auctionStart;

      auctionData.lots = lots.map((lot, index) => ({
        lotNumber: index + 1,
        title: lot.title,
        description: lot.description || '',
        category: lot.category || 'Miscellaneous', // Include category field
        image: lot.image || '',
        vendorId: lot.vendorId || null, // Include vendor ID
        startingPrice: lot.startingPrice,
        currentBid: lot.startingPrice,
        reservePrice: lot.reservePrice || 0,
        productId: lot.productId || null,
        bids: [],
        status: index === 0 && isAuctionStarted ? 'Active' : 'Upcoming',
        startTime: index === 0 ? auctionStart : null
        // endTime removed - lot duration is now based on bidding activity
      }));

      // Set current lot times if auction is starting
      if (isAuctionStarted) {
        auctionData.currentLotStartTime = auctionStart;
        // currentLotEndTime removed - lot ends based on bidding activity via Going Gone timer
        auctionData.lotNumber = 1; // Set current lot number
      }

      // Override main auction prices with first lot's prices
      auctionData.startingPrice = lots[0].startingPrice;
      auctionData.currentBid = lots[0].startingPrice;
    }

    const auction = new Auction(auctionData);

    // Set initial status
    await auction.updateStatus();

    const savedAuction = await auction.save();

    // Start 3-phase timer if enabled and auction is active
    const io = req.app.get('io');
    console.log(`🔍 Timer Check - io: ${!!io}, isThreePhaseTimerEnabled: ${savedAuction.isThreePhaseTimerEnabled}, status: ${savedAuction.status}`);
    if (io && savedAuction.isThreePhaseTimerEnabled && savedAuction.status === 'Active') {
      startThreePhaseTimer(savedAuction._id, io);
      console.log(`⏰ Started 3-phase timer for newly created auction ${savedAuction._id}`);
    } else {
      console.log(`⚠️  Timer NOT started for auction ${savedAuction._id}`);
    }

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: savedAuction
    });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create auction',
      error: error.message
    });
  }
};

// @desc    Update auction
// @route   PUT /api/auctions/:id
// @access  Admin
export const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Don't allow updates if auction has active bids (except status)
    if (auction.bids.length > 0 && req.body.startingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update starting price for auction with existing bids'
      });
    }

    const allowedUpdates = [
      'title',
      'description',
      'image',
      'startingPrice',
      'reservePrice',
      'incrementSlabs',
      'startTime',
      'endTime',
      'status',
      'reserveBidder'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        // Skip reserveBidder if it's empty string or null (let it remain unchanged)
        if (field === 'reserveBidder' && (!req.body[field] || req.body[field] === '')) {
          return;
        }
        auction[field] = req.body[field];
      }
    });

    // Handle lots update for lot bidding auctions
    if (req.body.lots && Array.isArray(req.body.lots)) {
      // Preserve category and vendorId fields when updating lots
      auction.lots = req.body.lots.map((lot, index) => ({
        ...lot,
        category: lot.category || 'Miscellaneous',
        vendorId: lot.vendorId || null
      }));
    }

    // Update status based on time
    await auction.updateStatus();

    const updatedAuction = await auction.save();

    res.json({
      success: true,
      message: 'Auction updated successfully',
      data: updatedAuction
    });
  } catch (error) {
    console.error('Update auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auction',
      error: error.message
    });
  }
};

// @desc    Delete auction
// @route   DELETE /api/auctions/:id
// @access  Admin
export const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Don't allow deletion of active auctions with bids
    if (auction.status === 'Active' && auction.bids.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active auction with existing bids'
      });
    }

    // IMPORTANT: Unfreeze all coins for this auction before deleting
    // Find all users with frozen coins for this auction
    const usersWithFrozenCoins = await User.find({
      'frozenCoinsPerAuction.auctionId': req.params.id
    });

    // Unfreeze coins for each user
    for (const user of usersWithFrozenCoins) {
      // Filter out all frozen entries for this auction
      const frozenForThisAuction = user.frozenCoinsPerAuction.filter(
        f => f.auctionId.toString() === req.params.id.toString()
      );

      // Calculate total frozen amount for this auction
      const totalFrozenForAuction = frozenForThisAuction.reduce(
        (sum, f) => sum + f.amount,
        0
      );

      // Remove frozen entries for this auction
      user.frozenCoinsPerAuction = user.frozenCoinsPerAuction.filter(
        f => f.auctionId.toString() !== req.params.id.toString()
      );

      // Decrease total frozen coins
      user.frozenCoins = Math.max(0, user.frozenCoins - totalFrozenForAuction);

      await user.save();
      console.log(`Unfroze ${totalFrozenForAuction} coins for user ${user.name} (${user.email}) before deleting auction`);
    }

    await Auction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Auction deleted successfully'
    });
  } catch (error) {
    console.error('Delete auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete auction',
      error: error.message
    });
  }
};

// @desc    Place a bid
// @route   POST /api/auctions/:id/bid
// @access  Protected
export const placeBid = async (req, res) => {
  try {
    const { amount, maxBid } = req.body;
    const userId = req.user._id;

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Update and check auction status
    await auction.updateStatus();

    if (auction.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot place bid. Auction is ${auction.status.toLowerCase()}`
      });
    }

    // Check user's auction coins
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isAuctionVerified) {
      return res.status(403).json({
        success: false,
        message: 'You must be verified for auctions to place bids'
      });
    }

    // Check if user has enough coins for the full bid amount
    if (user.auctionCoins < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You have ${user.auctionCoins.toLocaleString()} coins but need ${amount.toLocaleString()} coins for this bid`
      });
    }

    // FOR LOT BIDDING: Get current lot index
    let currentLotIndex = null;
    let currentLot = null;
    if (auction.isLotBidding) {
      currentLotIndex = (auction.lotNumber || 1) - 1;
      if (!auction.lots || !auction.lots[currentLotIndex]) {
        return res.status(400).json({
          success: false,
          message: 'Current lot not found'
        });
      }
      currentLot = auction.lots[currentLotIndex];

      if (currentLot.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot place bid. Current lot is ${currentLot.status.toLowerCase()}`
        });
      }

      // For LOT BIDDING: Use increment slab validation
      // Temporarily set auction.currentBid to currentLot.currentBid (or startingPrice if no bids)
      const originalCurrentBid = auction.currentBid;
      auction.currentBid = currentLot.currentBid || currentLot.startingPrice || 0;
      const validation = auction.validateBid(amount);
      auction.currentBid = originalCurrentBid; // Restore original value

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
    } else {
      // For NORMAL AUCTION: Use increment slab validation
      const validation = auction.validateBid(amount);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }
    }

    // If maxBid provided, validate it's >= amount and divisible by 50
    if (maxBid) {
      if (maxBid < amount) {
        return res.status(400).json({
          success: false,
          message: 'Maximum bid must be greater than or equal to current bid'
        });
      }

      if (maxBid % 50 !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Maximum bid must be divisible by 50'
        });
      }
    }

    // RESERVE BID LOGIC
    let autoBidTriggered = false;
    let previousReserveBidAmount = null;

    // If user is placing a reserve bid (maxBid)
    if (maxBid) {
      // Check if there's an existing higher reserve bid
      if (auction.highestReserveBid && maxBid <= auction.highestReserveBid) {
        // User's reserve bid is lower than existing reserve bid
        // Place the normal bid only

        if (auction.isLotBidding && currentLot) {
          // LOT BIDDING: Place bid in current lot's bids array
          currentLot.bids.push({
            user: userId,
            amount,
            maxBid: maxBid,
            isReserveBidder: false,
            isAutoBid: false,
            timestamp: new Date()
          });
          currentLot.currentBid = amount;
        } else {
          // NORMAL AUCTION: Place in main bids array
          auction.bids.push({
            user: userId,
            amount,
            maxBid: maxBid,
            isReserveBidder: false,
            isAutoBid: false
          });
        }

        auction.currentBid = amount;
        auction.totalBids = auction.bids.length;
      } else {
        // User's reserve bid is higher than existing reserve bid (or no existing reserve bid)
        // First, place the current bid

        if (auction.isLotBidding && currentLot) {
          // LOT BIDDING: Place bid in current lot's bids array
          currentLot.bids.push({
            user: userId,
            amount,
            maxBid: maxBid,
            isReserveBidder: false,
            isAutoBid: false,
            timestamp: new Date()
          });
          currentLot.currentBid = amount;
        } else {
          // NORMAL AUCTION: Place in main bids array
          auction.bids.push({
            user: userId,
            amount,
            maxBid: maxBid,
            isReserveBidder: false,
            isAutoBid: false
          });
        }

        auction.currentBid = amount;
        auction.totalBids = auction.bids.length;

        // If there was a previous reserve bid, automatically jump to that amount
        if (auction.highestReserveBid && auction.highestReserveBid > amount) {
          previousReserveBidAmount = auction.highestReserveBid;

          // Get the increment for the next bid
          const increment = auction.getCurrentIncrement();

          // Auto-increment to the previous reserve bid amount
          if (auction.isLotBidding && currentLot) {
            // LOT BIDDING: Auto-bid in current lot
            currentLot.bids.push({
              user: userId,
              amount: auction.highestReserveBid,
              maxBid: maxBid,
              isReserveBidder: false,
              isAutoBid: true,
              timestamp: new Date()
            });
            currentLot.currentBid = auction.highestReserveBid;
          } else {
            // NORMAL AUCTION: Auto-bid in main bids array
            auction.bids.push({
              user: userId,
              amount: auction.highestReserveBid,
              maxBid: maxBid,
              isReserveBidder: false,
              isAutoBid: true
            });
          }

          auction.currentBid = auction.highestReserveBid;
          auction.totalBids = auction.bids.length;

          // NOW: Auto-bid ONE MORE INCREMENT to make new bidder win
          const finalBidAmount = auction.highestReserveBid + increment;

          if (auction.isLotBidding && currentLot) {
            // LOT BIDDING: Place final winning auto-bid
            currentLot.bids.push({
              user: userId,
              amount: finalBidAmount,
              maxBid: maxBid,
              isReserveBidder: false,
              isAutoBid: true,
              timestamp: new Date()
            });
            currentLot.currentBid = finalBidAmount;
          } else {
            // NORMAL AUCTION: Place final winning auto-bid
            auction.bids.push({
              user: userId,
              amount: finalBidAmount,
              maxBid: maxBid,
              isReserveBidder: false,
              isAutoBid: true
            });
          }

          auction.currentBid = finalBidAmount;
          auction.totalBids = auction.bids.length;
          autoBidTriggered = true;
        }

        // Update the highest reserve bid and reserve bidder
        auction.highestReserveBid = maxBid;
        auction.reserveBidder = userId;
      }
    } else {
      // Normal bid without reserve bid

      if (auction.isLotBidding && currentLot) {
        // LOT BIDDING: Place bid in current lot's bids array
        currentLot.bids.push({
          user: userId,
          amount,
          timestamp: new Date()
        });
        currentLot.currentBid = amount;
      } else {
        // NORMAL AUCTION: Place in main bids array
        auction.bids.push({
          user: userId,
          amount,
          maxBid: null,
          isReserveBidder: false,
          isAutoBid: false
        });
      }

      auction.currentBid = amount;
      auction.totalBids = auction.bids.length;

      // AUTO-BID LOGIC: Check if there's an active reserve bidder who should auto-bid
      if (auction.highestReserveBid && auction.reserveBidder && auction.reserveBidder.toString() !== userId.toString()) {
        // There's a reserve bidder (not the current bidder)
        const increment = auction.getCurrentIncrement();
        const autoBidAmount = amount + increment;

        if (autoBidAmount <= auction.highestReserveBid) {
          // Reserve bidder can auto-bid
          const reserveBidderUser = await User.findById(auction.reserveBidder);

          if (reserveBidderUser && reserveBidderUser.auctionCoins >= autoBidAmount) {
            // Place auto-bid for reserve bidder

            if (auction.isLotBidding && currentLot) {
              // LOT BIDDING: Auto-bid in current lot
              currentLot.bids.push({
                user: auction.reserveBidder,
                amount: autoBidAmount,
                maxBid: auction.highestReserveBid,
                isReserveBidder: true,
                isAutoBid: true,
                timestamp: new Date()
              });
              currentLot.currentBid = autoBidAmount;
            } else {
              // NORMAL AUCTION: Auto-bid in main bids array
              auction.bids.push({
                user: auction.reserveBidder,
                amount: autoBidAmount,
                maxBid: auction.highestReserveBid,
                isReserveBidder: true,
                isAutoBid: true
              });
            }

            auction.currentBid = autoBidAmount;
            auction.totalBids = auction.bids.length;
            autoBidTriggered = true;

            // The current user's frozen coins will be unfrozen in the freeze/unfreeze logic below
            // Now freeze the reserve bidder's coins for the auto-bid
            if (auction.isLotBidding) {
              // LOT BIDDING: Use per-lot freeze for auto-bid
              const lotNumber = auction.lotNumber || 1;
              await freezeCoinsForLot(auction.reserveBidder, auction._id, lotNumber, autoBidAmount);
              console.log(`💰 Auto-bid LOT ${lotNumber}: Froze ${autoBidAmount} coins for reserve bidder ${auction.reserveBidder}`);
            } else {
              // NORMAL AUCTION: Use old freeze logic
              reserveBidderUser.auctionCoins -= autoBidAmount;
              reserveBidderUser.frozenCoins = autoBidAmount;
              await reserveBidderUser.save();
              console.log(`💰 Auto-bid: Froze ${autoBidAmount} coins for reserve bidder ${reserveBidderUser._id}. Available: ${reserveBidderUser.auctionCoins}, Frozen: ${reserveBidderUser.frozenCoins}`);
            }
          }
        } else if (amount >= auction.highestReserveBid) {
          // This bid has exceeded the reserve bid
          // Clear the reserve bid since it's been overtaken
          auction.highestReserveBid = null;
          auction.reserveBidder = null;
        }
      }
    }

    // FREEZE/UNFREEZE LOGIC
    // Find who was leading before this bid
    let bidsBeforeThis;
    if (auction.isLotBidding && currentLot) {
      // LOT BIDDING: Check previous bids in current lot
      bidsBeforeThis = currentLot.bids.slice(0, -1);
    } else {
      // NORMAL AUCTION: Check previous bids in main array
      bidsBeforeThis = auction.bids.slice(0, -1);
    }

    let outbidUserId = null;
    let outbidUserNewBalance = null;

    if (bidsBeforeThis.length > 0) {
      const sortedPrevBids = [...bidsBeforeThis].sort((a, b) => b.amount - a.amount);
      const previousHighestBid = sortedPrevBids[0];

      // Unfreeze previous leader's coins (they got outbid)
      if (previousHighestBid && previousHighestBid.user.toString() !== userId.toString()) {
        const io = req.app.get('io');

        if (auction.isLotBidding) {
          // LOT BIDDING: Use per-lot unfreeze
          const lotNumber = auction.lotNumber || 1;
          const unfreezeResult = await unfreezeCoinsForLot(previousHighestBid.user, auction._id, lotNumber);
          if (unfreezeResult.success && unfreezeResult.unfrozenAmount > 0) {
            console.log(`🔓 LOT ${lotNumber}: Unfroze ${unfreezeResult.unfrozenAmount} coins for outbid user ${previousHighestBid.user}`);
            outbidUserId = previousHighestBid.user.toString();
            outbidUserNewBalance = unfreezeResult.user.auctionCoins;

            // REAL-TIME: Emit coin balance update to outbid user
            if (io) {
              io.to(`user-${previousHighestBid.user.toString()}`).emit('coin-balance-updated', {
                auctionCoins: unfreezeResult.user.auctionCoins,
                frozenCoins: unfreezeResult.user.frozenCoins,
                reason: 'Outbid - coins refunded',
                lotNumber,
                auctionId: auction._id.toString()
              });
              console.log(`💰 Sent real-time coin update to outbid user ${previousHighestBid.user}: ${unfreezeResult.user.auctionCoins} coins`);
            }
          }
        } else {
          // NORMAL AUCTION: Use old freeze/unfreeze logic
          const previousLeader = await User.findById(previousHighestBid.user);
          if (previousLeader && previousLeader.frozenCoins > 0) {
            // Release frozen coins back to available
            previousLeader.auctionCoins += previousLeader.frozenCoins;
            const unfrozenAmount = previousLeader.frozenCoins;
            previousLeader.frozenCoins = 0;
            await previousLeader.save();
            console.log(`🔓 Unfroze ${unfrozenAmount} coins for outbid user ${previousLeader._id}. Available: ${previousLeader.auctionCoins}`);

            // Store outbid user info to send via Socket.io
            outbidUserId = previousLeader._id.toString();
            outbidUserNewBalance = previousLeader.auctionCoins;

            // REAL-TIME: Emit coin balance update to outbid user
            if (io) {
              io.to(`user-${previousLeader._id.toString()}`).emit('coin-balance-updated', {
                auctionCoins: previousLeader.auctionCoins,
                frozenCoins: previousLeader.frozenCoins,
                reason: 'Outbid - coins refunded',
                auctionId: auction._id.toString()
              });
              console.log(`💰 Sent real-time coin update to outbid user ${previousLeader._id}: ${previousLeader.auctionCoins} coins`);
            }
          }
        }
      }
    }

    // Update lastBidTime for Going, Going, Gone timer
    auction.lastBidTime = new Date();

    await auction.save();

    // Freeze the full bid amount
    const freezeAmount = amount;

    // Freeze the coins
    if (auction.isLotBidding) {
      // LOT BIDDING: Use per-lot freeze
      const lotNumber = auction.lotNumber || 1;
      await freezeCoinsForLot(userId, auction._id, lotNumber, freezeAmount);
      console.log(`🔒 LOT ${lotNumber}: Froze ${freezeAmount} coins for user ${userId}`);

      // Refresh user to get updated balances
      const updatedUser = await User.findById(userId);
      user.auctionCoins = updatedUser.auctionCoins;
      user.frozenCoins = updatedUser.frozenCoins;

      // REAL-TIME: Emit coin balance update to current bidder
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId.toString()}`).emit('coin-balance-updated', {
          auctionCoins: updatedUser.auctionCoins,
          frozenCoins: updatedUser.frozenCoins,
          reason: 'Bid placed - coins deducted',
          lotNumber,
          auctionId: auction._id.toString(),
          bidAmount: freezeAmount
        });
        console.log(`💰 Sent real-time coin update to bidder ${userId}: ${updatedUser.auctionCoins} coins`);
      }
    } else {
      // NORMAL AUCTION: Use old freeze logic
      user.auctionCoins -= freezeAmount;
      user.frozenCoins = freezeAmount;
      await user.save();
      console.log(`🔒 Froze ${freezeAmount} coins for user ${user._id}. Available: ${user.auctionCoins}, Frozen: ${user.frozenCoins}`);

      // REAL-TIME: Emit coin balance update to current bidder
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId.toString()}`).emit('coin-balance-updated', {
          auctionCoins: user.auctionCoins,
          frozenCoins: user.frozenCoins,
          reason: 'Bid placed - coins deducted',
          auctionId: auction._id.toString(),
          bidAmount: freezeAmount
        });
        console.log(`💰 Sent real-time coin update to bidder ${userId}: ${user.auctionCoins} coins`);
      }
    }

    // Populate the latest bid user info
    await auction.populate('bids.user', 'name email');

    // Get Socket.io instance and emit real-time update
    const io = req.app.get('io');
    if (io) {
      // Emit to all users in this auction room
      io.to(`auction-${auction._id}`).emit('bid-placed', {
        auction,
        latestBid: auction.bids[auction.bids.length - 1],
        autoBidTriggered,
        previousReserveBidAmount,
        outbidUser: outbidUserId ? {
          userId: outbidUserId,
          newBalance: outbidUserNewBalance
        } : null
      });

      // Reset 3-phase timer on new bid (stays in same phase)
      await resetPhaseTimer(auction._id, io);
    }

    res.json({
      success: true,
      message: autoBidTriggered && previousReserveBidAmount
        ? `Bid placed successfully. Auto-incremented to ₹${previousReserveBidAmount.toLocaleString()} (previous reserve bid)`
        : 'Bid placed successfully',
      data: {
        auction,
        latestBid: auction.bids[auction.bids.length - 1],
        autoBidTriggered,
        previousReserveBidAmount,
        remainingCoins: user.auctionCoins
      }
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place bid',
      error: error.message
    });
  }
};

// @desc    Get user's bids
// @route   GET /api/auctions/my-bids
// @access  Protected
export const getUserBids = async (req, res) => {
  try {
    const userId = req.user._id;

    const auctions = await Auction.find({
      'bids.user': userId
    })
      .populate('product', 'name price images')
      .populate('bids.user', 'name email')
      .sort({ 'bids.timestamp': -1 });

    // Filter to get only user's bids from each auction
    const userBids = auctions.map(auction => {
      const userAuctionBids = auction.bids.filter(
        bid => bid.user._id.toString() === userId.toString()
      );

      return {
        auction: {
          _id: auction._id,
          title: auction.title,
          image: auction.image,
          status: auction.status,
          currentBid: auction.currentBid,
          endTime: auction.endTime
        },
        bids: userAuctionBids,
        isWinning: auction.bids[auction.bids.length - 1]?.user._id.toString() === userId.toString()
      };
    });

    res.json({
      success: true,
      data: userBids
    });
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bids',
      error: error.message
    });
  }
};

// @desc    Set reserve bidder
// @route   PUT /api/auctions/:id/reserve-bidder
// @access  Admin
export const setReserveBidder = async (req, res) => {
  try {
    const { userId } = req.body;

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    auction.reserveBidder = userId || null;
    await auction.save();

    res.json({
      success: true,
      message: userId ? 'Reserve bidder set successfully' : 'Reserve bidder removed',
      data: auction
    });
  } catch (error) {
    console.error('Set reserve bidder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set reserve bidder',
      error: error.message
    });
  }
};

// @desc    Add multiple lots to an auction (bulk upload)
// @route   POST /api/auctions/:id/bulk-lots
// @access  Admin
export const addBulkLots = async (req, res) => {
  try {
    const { lots } = req.body;

    if (!lots || !Array.isArray(lots) || lots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lots array is required and must not be empty'
      });
    }

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Validate that this is a lot bidding auction
    if (!auction.isLotBidding) {
      return res.status(400).json({
        success: false,
        message: 'This auction is not configured for lot bidding'
      });
    }

    // Get current max lot number
    const currentMaxLotNumber = auction.lots && auction.lots.length > 0
      ? Math.max(...auction.lots.map(lot => lot.lotNumber))
      : 0;

    // Prepare lots with validated data
    const newLots = lots.map((lot, index) => ({
      lotNumber: lot.lotNumber || (currentMaxLotNumber + index + 1),
      title: lot.title,
      description: lot.description,
      category: lot.category || 'Miscellaneous',
      material: lot.material || null,
      image: lot.image,
      images: lot.images || (lot.image ? [lot.image] : []),
      video: lot.video || null,
      vendorId: lot.vendorId || null, // Vendor ID for admin tracking
      startingPrice: lot.startingPrice,
      currentBid: lot.startingPrice, // Initialize with starting price
      reservePrice: lot.reservePrice || 0,
      productId: lot.productId || null,
      bids: [],
      winner: null,
      status: 'Upcoming',
      unsoldReason: null,
      startTime: null,
      endTime: null
    }));

    // Add new lots to auction
    if (!auction.lots) {
      auction.lots = [];
    }
    auction.lots.push(...newLots);

    // Update total lots count
    auction.totalLots = auction.lots.length;

    await auction.save();

    res.json({
      success: true,
      message: `Successfully added ${newLots.length} lots to auction`,
      data: {
        auction,
        addedLots: newLots
      }
    });
  } catch (error) {
    console.error('Bulk lot upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add lots to auction',
      error: error.message
    });
  }
};

// Get price realization data for ended lot bidding auctions
export const getPriceRealization = async (req, res) => {
  try {
    // Fetch all ended lot bidding auctions
    const auctions = await Auction.find({
      isLotBidding: true,
      status: 'Ended'
    })
    .select('title startTime endTime status lots createdAt')
    .sort({ endTime: -1 }) // Newest first
    .lean();

    res.json({
      success: true,
      auctions: auctions
    });
  } catch (error) {
    console.error('Price realization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price realization data',
      error: error.message
    });
  }
};
