import Auction from '../models/Auction.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AuctionInvoice from '../models/AuctionInvoice.js';

// ============================================
// HELPER FUNCTION FOR IP TRACKING
// ============================================

/**
 * Extract client IP address from request headers
 * @param {Object} req - Express request object
 * @returns {String} - Client IP address
 */
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'Unknown';
};

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

/**
 * Get current winning bid using proper tie-breaking logic
 * Priority: highest amount > earliest timestamp > manual bid > earliest ObjectId
 * @param {Array} bids - Array of bid objects
 * @returns {Object|null} - Winning bid object or null
 */
export const getCurrentWinningBid = (bids) => {
  if (!bids || bids.length === 0) return null;

  // Find highest bid amount
  const highestAmount = Math.max(...bids.map(b => b.amount));

  // Filter to only bids at highest amount
  const bidsAtHighestAmount = bids.filter(b => b.amount === highestAmount);

  // Sort using tie-breaking logic: timestamp > reserve bidder > manual bid > ObjectId
  const sortedBids = bidsAtHighestAmount.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.timestamp).getTime();
    const timeB = new Date(b.createdAt || b.timestamp).getTime();

    // If timestamps are equal, apply priority rules
    if (timeA === timeB) {
      // FIRST: Reserve bidder wins (they placed reserve first, auto-bid just revealing it)
      const aIsReserve = a.isReserveBidder === true && a.isAutoBid === true;
      const bIsReserve = b.isReserveBidder === true && b.isAutoBid === true;

      if (aIsReserve !== bIsReserve) {
        return aIsReserve ? -1 : 1; // reserve bidder auto-bid comes first
      }

      // SECOND: Manual bids win over other auto-bids
      const aIsAuto = a.isAutoBid === true;
      const bIsAuto = b.isAutoBid === true;

      if (aIsAuto !== bIsAuto) {
        return aIsAuto ? 1 : -1; // non-auto bid comes first
      }

      // THIRD: If both have same auto-bid status, use ObjectId (earlier ObjectId = earlier bid)
      const idA = (a._id || '').toString();
      const idB = (b._id || '').toString();
      return idA.localeCompare(idB);
    }

    // Otherwise, oldest timestamp wins
    return timeA - timeB;
  });

  return sortedBids[0];
};

/**
 * Auto-bid for reserve price protection (system bids to push price toward reserve)
 * @param {Object} auction - Auction object
 * @param {Number} lotIndex - Lot index (for lot bidding) or null for regular auction
 * @returns {Boolean} - True if system bid was placed
 */
export const placeReservePriceAutoBid = async (auction, lotIndex = null) => {
  try {
    // Auto-bid works in BOTH catalog and live phases to protect reserve price

    let currentBid, reservePrice, lot;

    if (auction.isLotBidding && lotIndex !== null) {
      // Lot bidding - get current lot's data
      lot = auction.lots[lotIndex];
      if (!lot) return false;

      currentBid = lot.currentBid || lot.startingPrice;
      reservePrice = lot.reservePrice;
    } else {
      // Regular auction
      currentBid = auction.currentBid;
      reservePrice = auction.reservePrice;
    }

    // If no reserve price or reserve already met, no auto-bid needed
    if (!reservePrice || currentBid >= reservePrice) {
      return false;
    }

    // Calculate next bid amount using increment slabs
    const nextBidAmount = auction.getNextBidAmount(currentBid);

    // CRITICAL: Don't bid if next bid would meet or exceed reserve price
    // System should only push bids BELOW reserve, not AT or ABOVE reserve
    if (nextBidAmount >= reservePrice) {
      console.log(`🤖 System auto-bid stopped: Next bid ₹${nextBidAmount} would meet/exceed reserve ₹${reservePrice}`);
      return false;
    }

    const systemBidAmount = nextBidAmount;

    // Place system bid
    if (auction.isLotBidding && lot) {
      lot.bids.push({
        user: null, // No user for system bids
        amount: systemBidAmount,
        timestamp: new Date(),
        isSystemBid: true,
        isCatalogBid: false // System bids happen in live phase
      });
      lot.currentBid = systemBidAmount;
    } else {
      auction.bids.push({
        user: null,
        amount: systemBidAmount,
        timestamp: new Date(),
        isSystemBid: true
      });
      auction.currentBid = systemBidAmount;
    }

    console.log(`🤖 System auto-bid placed: ₹${systemBidAmount} (protecting reserve: ₹${reservePrice})`);
    return true;
  } catch (error) {
    console.error('Reserve price auto-bid error:', error);
    return false;
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

      // CRITICAL FIX: Check if any bidder has a reserve bid (maxBid) that meets reserve price
      // If yes, auto-bid them up to reserve price before ending lot
      if (winningBid.amount < reservePrice) {
        // Find all bids with maxBid property
        const reserveBids = currentLot.bids.filter(bid => bid.maxBid && bid.maxBid >= reservePrice);

        if (reserveBids.length > 0) {
          // Sort by maxBid to find highest reserve bidder
          const sortedReserveBids = [...reserveBids].sort((a, b) => b.maxBid - a.maxBid);
          const highestReserveBidder = sortedReserveBids[0];

          console.log(`🎯 Reserve bidder found! User ${highestReserveBidder.user} has maxBid ₹${highestReserveBidder.maxBid} >= reserve ₹${reservePrice}`);
          console.log(`🤖 Auto-bidding reserve bidder to reserve price ₹${reservePrice}`);

          // Place auto-bid at reserve price for the reserve bidder
          currentLot.bids.push({
            user: highestReserveBidder.user,
            amount: reservePrice,
            maxBid: highestReserveBidder.maxBid,
            isReserveBidder: true,
            isAutoBid: true,
            isCatalogBid: false, // This happens at lot end
            timestamp: new Date()
          });
          currentLot.currentBid = reservePrice;

          // Re-sort bids to get new winning bid
          const updatedSortedBids = [...currentLot.bids].sort((a, b) => b.amount - a.amount);
          const newWinningBid = updatedSortedBids[0];

          console.log(`✅ Reserve bidder auto-bid successful! New winning bid: ₹${newWinningBid.amount}`);

          // Now proceed to SOLD logic with updated winning bid
          // SOLD - Winner pays, losers get unfrozen
          currentLot.status = 'Sold';
          currentLot.winner = newWinningBid.user;
          currentLot.endTime = new Date();

          console.log(`✅ LOT ${lotNumber} SOLD to reserve bidder ${newWinningBid.user} for ₹${newWinningBid.amount}`);

          // Deduct winner's frozen coins
          await deductFrozenCoins(newWinningBid.user, auctionId, lotNumber, newWinningBid.amount);
          console.log(`💰 Deducted ₹${newWinningBid.amount} from winner ${newWinningBid.user}`);

          // Unfreeze all other bidders' coins
          for (const bid of currentLot.bids) {
            // Skip system bids (where user is null)
            if (!bid.user) {
              console.log(`⚠️  Skipping unfreeze for system bid on lot ${lotNumber}`);
              continue;
            }

            if (bid.user.toString() !== newWinningBid.user.toString()) {
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
          await autoGenerateInvoice(auctionId, lotNumber, currentLot, newWinningBid.user);

          // Emit final announcement and socket event
          if (io) {
            // Emit SOLD announcement
            io.to(`auction-${auctionId}`).emit('auction-warning', {
              auctionId: auctionId.toString(),
              message: 'SOLD! 🎉',
              warning: 3,
              final: true,
              lotNumber,
              finalPrice: newWinningBid.amount
            });

            // Emit lot-sold event
            io.to(`auction-${auctionId}`).emit('lot-sold', {
              auctionId,
              lotNumber,
              winner: newWinningBid.user,
              finalPrice: newWinningBid.amount,
              nextLotNumber: auction.lotNumber + 1 <= auction.totalLots ? auction.lotNumber + 1 : null
            });
          }
        } else {
          // No reserve bidder with sufficient maxBid - Mark as UNSOLD
          // BELOW RESERVE PRICE - Mark as UNSOLD
          currentLot.status = 'Unsold';
          currentLot.unsoldReason = 'Below reserve price';
          currentLot.endTime = new Date();

          console.log(`❌ LOT ${lotNumber} UNSOLD - Winning bid ₹${winningBid.amount} below reserve ₹${reservePrice}`);

          // Unfreeze all bidders' coins for this lot
          for (const bid of currentLot.bids) {
            // Skip system bids (where user is null)
            if (!bid.user) {
              console.log(`⚠️  Skipping unfreeze for system bid on lot ${lotNumber}`);
              continue;
            }

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
          // Skip system bids (where user is null)
          if (!bid.user) {
            console.log(`⚠️  Skipping unfreeze for system bid on lot ${lotNumber}`);
            continue;
          }

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

          // Capture the generation and lot number for timer callback
          const capturedGen = newGen;
          const capturedLotNumber = auction.lotNumber;
          const nextLotTimerKey = getTimerKey(auctionId, capturedLotNumber);

          // Start timer after 3-second pause
          setTimeout(async () => {
            // CRITICAL: Check if this callback is still valid (not superseded by newer lot switch)
            const currentGen = timerGeneration.get(nextLotTimerKey);
            if (currentGen !== capturedGen) {
              console.log(`⚠️  [GEN ${capturedGen}] Lot start callback superseded by gen ${currentGen}, skipping timer start`);
              return;
            }

            // Restart 3-phase timer for new lot
            if (auction.isThreePhaseTimerEnabled) {
              startThreePhaseTimer(auctionId, io);
              console.log(`⏰ [GEN ${capturedGen}] Started 3-phase timer for newly activated Lot ${capturedLotNumber}`);
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
// Display: Phase 1 shows 30→20, Phase 2 shows 20→10, Phase 3 shows 10→0
// Bid resets: Phase 1 resets to 30s, Phase 2 resets to 20s, Phase 3 resets to 10s
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
    // Initial display values: Phase 1 shows 30, Phase 2 shows 20, Phase 3 shows 10
    const phaseInitialValues = { 1: 30, 2: 20, 3: 10 };
    auction.phaseTimer = phaseInitialValues[auction.callNumber] || 30;
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

      // CRITICAL: Check if current lot is already ended (SOLD/UNSOLD/Ended)
      if (auction.isLotBidding && auction.lots && auction.lots[currentLotNum - 1]) {
        const currentLot = auction.lots[currentLotNum - 1];
        if (currentLot.status === 'Sold' || currentLot.status === 'Unsold' || currentLot.status === 'Ended') {
          console.log(`⏹️  LOT ${currentLotNum} already ${currentLot.status}, stopping timer for ${timerKey}`);
          auctionTimers.delete(timerKey);
          timerGeneration.delete(timerKey);
          return;
        }
      }

      const now = new Date();
      const phaseStartTime = new Date(auction.phaseStartTime);
      const elapsedSeconds = Math.floor((now - phaseStartTime) / 1000);

      // Phase durations: Each phase lasts 10 seconds (30s total)
      const phaseDurations = { 1: 10, 2: 10, 3: 10 };
      const phaseDuration = phaseDurations[auction.callNumber] || 10;

      // Display values: Phase 1 shows 30→20, Phase 2 shows 20→10, Phase 3 shows 10→0
      const phaseInitialValues = { 1: 30, 2: 20, 3: 10 };
      const initialValue = phaseInitialValues[auction.callNumber] || 30;

      // Calculate display time (counts down from initial value)
      const remainingSeconds = Math.max(0, initialValue - elapsedSeconds);

      // Update phaseTimer for display
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

      console.log(`⏱️  [${timerKey}] Phase ${auction.callNumber}: ${remainingSeconds}s remaining (${elapsedSeconds}s elapsed)`);

      // Check if phase is complete (based on elapsed time, not display value)
      if (elapsedSeconds >= phaseDuration) {
        // Phase completed, move to next phase
        if (auction.callNumber < 3) {
          // Move to next phase
          auction.callNumber++;

          // Set initial display value for next phase (Phase 2 shows 20, Phase 3 shows 10)
          const nextPhaseInitialValues = { 2: 20, 3: 10 };
          auction.phaseTimer = nextPhaseInitialValues[auction.callNumber] || 10;
          auction.phaseStartTime = new Date();
          await auction.save();

          // Emit flash message at phase transition
          const flashMessages = { 2: '⚠️ Going Once!', 3: '🚨 Going Twice!' };
          io.to(`auction-${auctionId}`).emit('auction-phase-transition', {
            auctionId: auctionId.toString(),
            callNumber: auction.callNumber,
            flashMessage: flashMessages[auction.callNumber],
            phaseTimer: auction.phaseTimer
          });

          console.log(`🔄 [${timerKey}] Moving to Phase ${auction.callNumber} (display: ${auction.phaseTimer}s)`);

          // Continue ticking
          const timerId = setTimeout(tickPhase, 1000);
          auctionTimers.set(timerKey, { timerId, generation: currentGen });
        } else {
          // Phase 3 complete - end lot
          console.log(`🎯 [${timerKey}] Phase 3 complete - ending lot`);

          if (auction.isLotBidding) {
            const result = await endCurrentLot(auctionId, io);
            if (!result || !result.success) {
              console.log(`⚠️  [${timerKey}] endCurrentLot failed or lot already ended, stopping timer`);
              auctionTimers.delete(timerKey);
              timerGeneration.delete(timerKey);
              return;
            }
          } else {
            auction.status = 'Ended';
            await auction.updateStatus();
            await auction.save();
          }

          // Clear timer (already cleared in endCurrentLot, but double-check)
          auctionTimers.delete(timerKey);
          timerGeneration.delete(timerKey);
          console.log(`✅ [${timerKey}] Timer fully stopped after lot completion`);
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

      // Reset phase timer to phase-specific display value (stay in same phase)
      // Phase 1: reset to 30s display, Phase 2: reset to 20s display, Phase 3: reset to 10s display
      // Each phase still lasts 10 seconds, but display resets to phase's initial value
      const phaseResetValues = { 1: 30, 2: 20, 3: 10 };
      const resetTime = phaseResetValues[auction.callNumber] || 30;

      auction.phaseTimer = resetTime;
      auction.phaseStartTime = new Date();
      auction.lastBidTime = new Date();
      await auction.save();

      // Emit reset event
      io.to(`auction-${auctionId}`).emit('auction-phase-reset', {
        auctionId: auctionId.toString(),
        callNumber: auction.callNumber,
        phaseTimer: resetTime,
        message: `New bid! Timer reset to ${resetTime} seconds.`
      });

      console.log(`🔄 [${timerKey}] Phase ${auction.callNumber} timer reset to ${resetTime}s display (10s duration)`);

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
      .populate('lots.bids.user', 'name email')  // FOR LOT BIDDING
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
      .populate('bids.user', 'name email')
      .populate('lots.bids.user', 'name email');  // FOR LOT BIDDING

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
      highlightImage,
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
      highlightImage: highlightImage || null,
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
        material: lot.material || null, // Include material field
        image: lot.image || '',
        images: lot.images || (lot.image ? [lot.image] : []), // Include images array
        video: lot.video || null, // Include video field
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
      'highlightImage',
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
    const { amount, maxBid, lotNumber } = req.body; // Accept lotNumber for catalog phase
    const userId = req.user._id;

    // Capture IP address and user agent for bid tracking
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    console.log(`🎯 BID REQUEST: amount=${amount}, lotNumber=${lotNumber}, userId=${userId}, ip=${ipAddress}`);

    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Update and check auction status
    await auction.updateStatus();

    // PHASE DETECTION: Determine if we're in Catalog or Live phase
    const now = new Date();
    const auctionStartTime = new Date(auction.startTime);
    const isInCatalogPhase = auction.catalogBiddingEnabled && now < auctionStartTime;
    const isInLivePhase = now >= auctionStartTime;

    console.log(`📊 Phase Detection: catalogEnabled=${auction.catalogBiddingEnabled}, now=${now.toISOString()}, start=${auctionStartTime.toISOString()}, catalog=${isInCatalogPhase}, live=${isInLivePhase}`);

    // Allow bidding in both Catalog and Live phases
    if (auction.status !== 'Active' && !isInCatalogPhase) {
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
      // CATALOG PHASE: Allow bidding on any lot (use lotNumber from request)
      // LIVE PHASE: Only allow bidding on current active lot (use auction.lotNumber)
      if (isInCatalogPhase && lotNumber) {
        currentLotIndex = lotNumber - 1; // User-specified lot in catalog phase
        console.log(`📚 Catalog Phase: Bidding on Lot #${lotNumber}`);
      } else {
        currentLotIndex = (auction.lotNumber || 1) - 1; // Current active lot in live phase
        console.log(`🔴 Live Phase: Bidding on active Lot #${auction.lotNumber || 1}`);
      }
      if (!auction.lots || !auction.lots[currentLotIndex]) {
        return res.status(400).json({
          success: false,
          message: 'Current lot not found'
        });
      }
      currentLot = auction.lots[currentLotIndex];

      // Allow bidding in both Catalog and Live phases for lots too
      if (currentLot.status !== 'Active' && !isInCatalogPhase) {
        return res.status(400).json({
          success: false,
          message: `Cannot place bid. Current lot is ${currentLot.status.toLowerCase()}`
        });
      }

      // For LOT BIDDING: Validate bid amount
      if (currentLot.bids && currentLot.bids.length > 0) {
        // LOT HAS BIDS: Use increment slab validation
        const originalCurrentBid = auction.currentBid;
        auction.currentBid = currentLot.currentBid;
        const validation = auction.validateBid(amount);
        auction.currentBid = originalCurrentBid; // Restore original value

        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message
          });
        }
      } else {
        // FIRST BID ON LOT: Must be >= starting price
        const startingPrice = currentLot.startingPrice || 0;

        if (amount < startingPrice) {
          return res.status(400).json({
            success: false,
            message: `First bid must be at least ₹${startingPrice.toLocaleString('en-IN')}`
          });
        }

        if (amount % 50 !== 0) {
          return res.status(400).json({
            success: false,
            message: 'Bid amount must be divisible by 50'
          });
        }
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
    let systemBidPlaced = false;
    let previousReserveBidAmount = null;

    // Determine which level to check for reserve bids (lot-level for lot bidding, auction-level for normal)
    const existingHighestReserveBid = (auction.isLotBidding && currentLot)
      ? currentLot.highestReserveBid
      : auction.highestReserveBid;
    const existingReserveBidder = (auction.isLotBidding && currentLot)
      ? currentLot.reserveBidder
      : auction.reserveBidder;

    // Check if this is a TRUE reserve bid (maxBid > amount) or normal bid (maxBid === amount)
    const hasBidsAlready = (auction.isLotBidding && currentLot)
      ? (currentLot.bids && currentLot.bids.length > 0)
      : (auction.bids && auction.bids.length > 0);

    // Calculate minimum required bid to determine if this is reserve or normal
    const currentBidAmount = hasBidsAlready
      ? ((auction.isLotBidding && currentLot) ? currentLot.currentBid : auction.currentBid)
      : 0;

    const minBidRequired = (currentBidAmount && currentBidAmount > 0)
      ? currentBidAmount + auction.getCurrentIncrement()
      : (currentLot?.startingPrice || auction.startingPrice || 0);

    // TRUE reserve bid logic:
    // 1. maxBid > amount (different max)
    // 2. amount > minRequired (bidding more than minimum = reserve)
    // 3. First bid with maxBid (no existing bids)
    const isTrueReserveBid = maxBid && (
      maxBid > amount ||
      amount > minBidRequired ||
      (!hasBidsAlready && maxBid === amount)
    );

    // If user is placing a reserve bid (maxBid)
    if (isTrueReserveBid) {
      console.log(`🔍 RESERVE BID CHECK: maxBid=${maxBid}, existing highestReserveBid=${existingHighestReserveBid}, amount=${amount}, isLotBidding=${auction.isLotBidding}, lotNumber=${lotNumber}`);

      // SPECIAL CASE: Same user updating their own reserve bid
      if (existingReserveBidder && existingReserveBidder.toString() === userId.toString()) {
        console.log(`🔄 SAME USER updating reserve: old ₹${existingHighestReserveBid} → new ₹${maxBid}`);

        // VALIDATION: Only allow INCREASING reserve, not decreasing
        if (maxBid <= existingHighestReserveBid) {
          console.log(`❌ Cannot LOWER reserve: ₹${existingHighestReserveBid} → ₹${maxBid} not allowed`);
          return res.status(400).json({
            success: false,
            message: `Your reserve bid of ₹${existingHighestReserveBid.toLocaleString('en-IN')} is already placed. You can only increase it, not decrease.`
          });
        }

        // Update reserve to new amount
        auction.highestReserveBid = maxBid;
        auction.reserveBidder = userId;

        if (auction.isLotBidding && currentLot) {
          currentLot.highestReserveBid = maxBid;
          currentLot.reserveBidder = userId;
        }

        console.log(`✅ Reserve INCREASED: ₹${existingHighestReserveBid} → ₹${maxBid}`);

        // CHECK: Is someone else currently winning? If yes, auto-bid to beat them!
        const currentBidAmount = (auction.isLotBidding && currentLot)
          ? (currentLot.currentBid || 0)
          : (auction.currentBid || 0);

        // Use proper tie-breaking logic to determine current winner
        const currentWinningBid = (auction.isLotBidding && currentLot && currentLot.bids.length > 0)
          ? getCurrentWinningBid(currentLot.bids)
          : (auction.bids.length > 0 ? getCurrentWinningBid(auction.bids) : null);

        const currentWinner = currentWinningBid?.user;
        const someoneElseWinning = currentWinner && currentWinner.toString() !== userId.toString();

        if (someoneElseWinning && maxBid > currentBidAmount) {
          // Someone else is winning, place auto-bid to beat them
          const increment = auction.getCurrentIncrement();
          const autoBidAmount = currentBidAmount + increment;

          console.log(`🚀 AUTO-BID after reserve update: Someone else winning at ₹${currentBidAmount}, auto-bidding to ₹${autoBidAmount}`);

          // UNFREEZE coins for the user who is being outbid
          const io = req.app.get('io');
          if (auction.isLotBidding) {
            const unfreezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
            const unfreezeResult = await unfreezeCoinsForLot(currentWinner, auction._id, unfreezeLotNumber);
            if (unfreezeResult.success && unfreezeResult.unfrozenAmount > 0) {
              console.log(`🔓 OUTBID - LOT ${unfreezeLotNumber}: Unfroze ${unfreezeResult.unfrozenAmount} coins for ${currentWinner}`);

              // Send outbid notification
              if (io) {
                io.to(`user-${currentWinner.toString()}`).emit('coin-balance-updated', {
                  auctionCoins: unfreezeResult.user.auctionCoins,
                  frozenCoins: unfreezeResult.user.frozenCoins,
                  reason: 'Outbid - coins refunded',
                  lotNumber: unfreezeLotNumber,
                  auctionId: auction._id.toString()
                });
                console.log(`📢 OUTBID NOTIFICATION sent to ${currentWinner}`);
              }
            }
          } else {
            const outbidUser = await User.findById(currentWinner);
            if (outbidUser && outbidUser.frozenCoins > 0) {
              outbidUser.auctionCoins += outbidUser.frozenCoins;
              outbidUser.frozenCoins = 0;
              await outbidUser.save();

              // Send outbid notification
              if (io) {
                io.to(`user-${currentWinner.toString()}`).emit('coin-balance-updated', {
                  auctionCoins: outbidUser.auctionCoins,
                  frozenCoins: outbidUser.frozenCoins,
                  reason: 'Outbid - coins refunded',
                  auctionId: auction._id.toString()
                });
                console.log(`📢 OUTBID NOTIFICATION sent to ${currentWinner}`);
              }
            }
          }

          if (auction.isLotBidding && currentLot) {
            currentLot.bids.push({
              user: userId,
              amount: autoBidAmount,
              maxBid: maxBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              timestamp: new Date(),
              ipAddress,
              userAgent
            });
            currentLot.currentBid = autoBidAmount;
          } else {
            auction.bids.push({
              user: userId,
              amount: autoBidAmount,
              maxBid: maxBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              ipAddress,
              userAgent
            });
          }

          auction.currentBid = autoBidAmount;
          auction.totalBids = auction.bids.length;
        }

        await auction.save();

        // EMIT SOCKET EVENT for real-time update
        const io = req.app.get('io');
        if (io) {
          const auctionObject = JSON.parse(JSON.stringify(auction));

          // Get latest bid
          let latestBid;
          if (auction.isLotBidding && currentLot && currentLot.bids && currentLot.bids.length > 0) {
            latestBid = currentLot.bids[currentLot.bids.length - 1];
          } else if (auction.bids && auction.bids.length > 0) {
            latestBid = auction.bids[auction.bids.length - 1];
          }

          // Include outbid user info if someone was outbid
          let outbidUserInfo = null;
          if (someoneElseWinning && maxBid > currentBidAmount) {
            const outbidUser = await User.findById(currentWinner);
            if (outbidUser) {
              outbidUserInfo = {
                userId: currentWinner.toString(),
                newBalance: outbidUser.auctionCoins
              };
            }
          }

          console.log(`📡 RESERVE UPDATE: Emitting bid-placed event for auction ${auction._id}, outbid user: ${outbidUserInfo ? outbidUserInfo.userId : 'none'}`);
          io.to(`auction-${auction._id}`).emit('bid-placed', {
            auction: auctionObject,
            latestBid,
            autoBidTriggered: someoneElseWinning && maxBid > currentBidAmount,
            previousReserveBidAmount: null,
            outbidUser: outbidUserInfo
          });

          // Reset timer if auto-bid was placed
          if (someoneElseWinning && maxBid > currentBidAmount) {
            await resetPhaseTimer(auction._id, io);
          }
        }

        return res.json({
          success: true,
          message: `Reserve bid increased to ₹${maxBid.toLocaleString('en-IN')}`,
          auction: auction.toJSON(),
          updatedReserve: true,
          autoBidPlaced: someoneElseWinning && maxBid > currentBidAmount
        });
      }

      // Check if there's an existing higher reserve bid (from DIFFERENT user)
      if (existingHighestReserveBid && maxBid <= existingHighestReserveBid) {
        console.log(`❌ NEW maxBid (${maxBid}) <= EXISTING reserve (${existingHighestReserveBid}) - Will place normal bid and trigger auto-bid`);
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
            isCatalogBid: isInCatalogPhase,
            timestamp: new Date(),
            ipAddress,
            userAgent
          });
          currentLot.currentBid = amount;
        } else {
          // NORMAL AUCTION: Place in main bids array
          auction.bids.push({
            user: userId,
            amount,
            maxBid: maxBid,
            isReserveBidder: false,
            isAutoBid: false,
            isCatalogBid: isInCatalogPhase,
            ipAddress,
            userAgent
          });
        }

        auction.currentBid = amount;
        auction.totalBids = auction.bids.length;

        // IMPORTANT: Existing reserve bidder should auto-bid to beat this new lower bid!
        // Trigger when reserve >= amount (reserve bidder placed bid first, auto-bid reveals it)
        if (existingHighestReserveBid >= amount && existingReserveBidder && existingReserveBidder.toString() !== userId.toString()) {
          console.log(`🚀 AUTO-BID FOR EXISTING RESERVE: Existing reserve bidder (₹${existingHighestReserveBid}) will auto-bid to beat new bid (₹${amount})`);

          const increment = auction.getCurrentIncrement();
          const autoBidAmount = Math.min(amount + increment, existingHighestReserveBid);

          console.log(`💰 AUTO-BID AMOUNT: min(${amount} + ${increment}, ${existingHighestReserveBid}) = ₹${autoBidAmount}`);

          // Unfreeze new bidder's coins (they're being outbid immediately)
          if (auction.isLotBidding) {
            const unfreezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
            const unfreezeResult = await unfreezeCoinsForLot(userId, auction._id, unfreezeLotNumber);
            if (unfreezeResult.success) {
              console.log(`🔓 LOT ${unfreezeLotNumber}: Unfroze ${unfreezeResult.unfrozenAmount} coins for outbid user ${userId}`);
            }
          }

          // Place auto-bid for existing reserve bidder
          if (auction.isLotBidding && currentLot) {
            currentLot.bids.push({
              user: existingReserveBidder,
              amount: autoBidAmount,
              maxBid: existingHighestReserveBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              timestamp: new Date(),
              ipAddress,
              userAgent
            });
            currentLot.currentBid = autoBidAmount;
          } else {
            auction.bids.push({
              user: existingReserveBidder,
              amount: autoBidAmount,
              maxBid: existingHighestReserveBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              ipAddress,
              userAgent
            });
          }

          auction.currentBid = autoBidAmount;
          auction.totalBids = auction.bids.length;
          autoBidTriggered = true;
          systemBidPlaced = true;

          // Freeze coins for existing reserve bidder's auto-bid
          if (auction.isLotBidding) {
            const freezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
            await freezeCoinsForLot(existingReserveBidder, auction._id, freezeLotNumber, autoBidAmount);
            console.log(`🔒 LOT ${freezeLotNumber}: Froze ${autoBidAmount} coins for existing reserve bidder ${existingReserveBidder}`);
          }

          console.log(`✅ AUTO-BID PLACED: Existing reserve bidder auto-bid at ₹${autoBidAmount}, reserve: ₹${existingHighestReserveBid}`);
        }
      } else {
        console.log(`✅ NEW maxBid (${maxBid}) > EXISTING reserve (${existingHighestReserveBid || 'none'}) - SLAB-BASED LOGIC`);
        // User's reserve bid is higher than existing reserve bid (or no existing reserve bid)

        const increment = auction.getCurrentIncrement();

        // Check if beating an existing reserve from different user
        const isBeatingReserve = existingHighestReserveBid && existingReserveBidder &&
                                  existingReserveBidder.toString() !== userId.toString() &&
                                  maxBid > existingHighestReserveBid;

        // Calculate RESERVE SLAB THRESHOLD (reserve + 1 increment)
        const reserveSlabThreshold = existingHighestReserveBid
          ? existingHighestReserveBid + increment
          : 0;

        // Determine bid type
        const isNormalBid = isBeatingReserve && maxBid < reserveSlabThreshold;
        const isReserveBid = isBeatingReserve && maxBid >= reserveSlabThreshold;

        console.log(`🎯 SLAB CHECK: reserve=₹${existingHighestReserveBid}, slab=₹${reserveSlabThreshold}, newBid=₹${maxBid}, isNormal=${isNormalBid}, isReserve=${isReserveBid}`);

        if (isNormalBid) {
          // CASE: Reserve < bid < slab (e.g., ₹6,000 < ₹6,100 < ₹6,500)
          // Reveal old reserve, place as normal bid (NOT reserve)
          console.log(`💰 NORMAL BID: ₹${maxBid} is between reserve ₹${existingHighestReserveBid} and slab ₹${reserveSlabThreshold}`);

          // Unfreeze old reserve bidder's coins
          const io = req.app.get('io');
          if (auction.isLotBidding) {
            const unfreezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
            const unfreezeResult = await unfreezeCoinsForLot(existingReserveBidder, auction._id, unfreezeLotNumber);
            if (unfreezeResult.success && unfreezeResult.unfrozenAmount > 0) {
              console.log(`🔓 OLD RESERVE OUTBID - LOT ${unfreezeLotNumber}: Unfroze ${unfreezeResult.unfrozenAmount} coins for ${existingReserveBidder}`);
              if (io) {
                io.to(`user-${existingReserveBidder.toString()}`).emit('coin-balance-updated', {
                  auctionCoins: unfreezeResult.user.auctionCoins,
                  frozenCoins: unfreezeResult.user.frozenCoins,
                  reason: 'Outbid - coins refunded',
                  lotNumber: unfreezeLotNumber,
                  auctionId: auction._id.toString()
                });
              }
            }
          } else {
            const oldReserveBidderUser = await User.findById(existingReserveBidder);
            if (oldReserveBidderUser && oldReserveBidderUser.frozenCoins > 0) {
              oldReserveBidderUser.auctionCoins += oldReserveBidderUser.frozenCoins;
              oldReserveBidderUser.frozenCoins = 0;
              await oldReserveBidderUser.save();
              if (io) {
                io.to(`user-${existingReserveBidder.toString()}`).emit('coin-balance-updated', {
                  auctionCoins: oldReserveBidderUser.auctionCoins,
                  frozenCoins: oldReserveBidderUser.frozenCoins,
                  reason: 'Outbid - coins refunded',
                  auctionId: auction._id.toString()
                });
              }
            }
          }

          // STEP 1: Reveal old reserve bidder's max bid
          if (auction.isLotBidding && currentLot) {
            currentLot.bids.push({
              user: existingReserveBidder,
              amount: existingHighestReserveBid,
              maxBid: existingHighestReserveBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              timestamp: new Date(),
              ipAddress,
              userAgent
            });
            currentLot.currentBid = existingHighestReserveBid;
          } else {
            auction.bids.push({
              user: existingReserveBidder,
              amount: existingHighestReserveBid,
              maxBid: existingHighestReserveBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              ipAddress,
              userAgent
            });
          }
          auction.currentBid = existingHighestReserveBid;
          auction.totalBids = auction.bids.length;

          // STEP 2: Place new bidder's bid as NORMAL BID (not reserve)
          if (auction.isLotBidding && currentLot) {
            currentLot.bids.push({
              user: userId,
              amount: amount,
              maxBid: maxBid,
              isReserveBidder: false, // NOT a reserve bidder!
              isAutoBid: false,
              isCatalogBid: isInCatalogPhase,
              timestamp: new Date(),
              ipAddress,
              userAgent
            });
            currentLot.currentBid = amount;
          } else {
            auction.bids.push({
              user: userId,
              amount: amount,
              maxBid: maxBid,
              isReserveBidder: false, // NOT a reserve bidder!
              isAutoBid: false,
              isCatalogBid: isInCatalogPhase,
              ipAddress,
              userAgent
            });
          }
          auction.currentBid = amount;
          auction.totalBids = auction.bids.length;

          // CRITICAL FIX: Clear old reserve bidder (their reserve was revealed, no longer hidden)
          if (auction.isLotBidding && currentLot) {
            currentLot.reserveBidder = null;
            currentLot.highestReserveBid = null;
          }
          auction.reserveBidder = null;
          auction.highestReserveBid = null;

          console.log(`✅ NORMAL BID PLACED: Old reserve ₹${existingHighestReserveBid} revealed, New bid ₹${amount} wins (NOT reserve)`);

        } else if (isReserveBid) {
          // CASE: Bid >= slab (e.g., ₹6,600 >= ₹6,500)
          // Reveal old reserve ONLY, new bid becomes hidden reserve
          console.log(`💎 RESERVE BID: ₹${maxBid} >= slab ₹${reserveSlabThreshold}, creating HIDDEN reserve`);

          // Unfreeze old reserve bidder's coins
          const io = req.app.get('io');
          if (auction.isLotBidding) {
            const unfreezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
            const unfreezeResult = await unfreezeCoinsForLot(existingReserveBidder, auction._id, unfreezeLotNumber);
            if (unfreezeResult.success && unfreezeResult.unfrozenAmount > 0) {
              console.log(`🔓 OLD RESERVE OUTBID - LOT ${unfreezeLotNumber}: Unfroze ${unfreezeResult.unfrozenAmount} coins for ${existingReserveBidder}`);
              if (io) {
                io.to(`user-${existingReserveBidder.toString()}`).emit('coin-balance-updated', {
                  auctionCoins: unfreezeResult.user.auctionCoins,
                  frozenCoins: unfreezeResult.user.frozenCoins,
                  reason: 'Outbid - coins refunded',
                  lotNumber: unfreezeLotNumber,
                  auctionId: auction._id.toString()
                });
              }
            }
          } else {
            const oldReserveBidderUser = await User.findById(existingReserveBidder);
            if (oldReserveBidderUser && oldReserveBidderUser.frozenCoins > 0) {
              oldReserveBidderUser.auctionCoins += oldReserveBidderUser.frozenCoins;
              oldReserveBidderUser.frozenCoins = 0;
              await oldReserveBidderUser.save();
              if (io) {
                io.to(`user-${existingReserveBidder.toString()}`).emit('coin-balance-updated', {
                  auctionCoins: oldReserveBidderUser.auctionCoins,
                  frozenCoins: oldReserveBidderUser.frozenCoins,
                  reason: 'Outbid - coins refunded',
                  auctionId: auction._id.toString()
                });
              }
            }
          }

          // STEP 1: Reveal old reserve bidder's max bid ONLY
          if (auction.isLotBidding && currentLot) {
            currentLot.bids.push({
              user: existingReserveBidder,
              amount: existingHighestReserveBid,
              maxBid: existingHighestReserveBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              timestamp: new Date(),
              ipAddress,
              userAgent
            });
            currentLot.currentBid = existingHighestReserveBid;

            // STEP 2: Update lot reserve to new bidder (HIDDEN)
            currentLot.highestReserveBid = maxBid;
            currentLot.reserveBidder = userId;
          } else {
            auction.bids.push({
              user: existingReserveBidder,
              amount: existingHighestReserveBid,
              maxBid: existingHighestReserveBid,
              isReserveBidder: true,
              isAutoBid: true,
              isCatalogBid: isInCatalogPhase,
              ipAddress,
              userAgent
            });

            // STEP 2: Update auction reserve to new bidder (HIDDEN)
            auction.highestReserveBid = maxBid;
            auction.reserveBidder = userId;
          }

          auction.currentBid = existingHighestReserveBid;
          auction.totalBids = auction.bids.length;

          console.log(`✅ RESERVE BID PLACED: Old reserve ₹${existingHighestReserveBid} revealed, New reserve ₹${maxBid} HIDDEN`);

        } else {
          // NO RESERVE BATTLE: Normal proxy bidding
          console.log(`🔄 NO RESERVE BATTLE: Placing normal bid`);

          // PROXY BIDDING: Always place MINIMUM required, not full amount
          const hasBids = (auction.isLotBidding && currentLot)
            ? (currentLot.bids && currentLot.bids.length > 0)
            : (auction.bids && auction.bids.length > 0);

          // Calculate minimum bid to place (proxy bidding logic)
          let bidAmountToPlace;
          if (!hasBids) {
            // First bid: place starting price
            bidAmountToPlace = currentLot?.startingPrice || auction.startingPrice || amount;
          } else {
            // Has existing bids: place minimum required (current + increment)
            const currentBid = (auction.isLotBidding && currentLot) ? currentLot.currentBid : auction.currentBid;
            const increment = auction.getCurrentIncrement();
            bidAmountToPlace = currentBid + increment;
          }

          console.log(`💎 PROXY BID: hasBids=${hasBids}, current=₹${hasBids ? ((auction.isLotBidding && currentLot) ? currentLot.currentBid : auction.currentBid) : 0}, placing ₹${bidAmountToPlace}, reserve ₹${maxBid}`);

          if (auction.isLotBidding && currentLot) {
            currentLot.bids.push({
              user: userId,
              amount: bidAmountToPlace,
              maxBid: maxBid,
              isReserveBidder: true,
              isAutoBid: false,
              isCatalogBid: isInCatalogPhase,
              timestamp: new Date(),
              ipAddress,
              userAgent
            });
            currentLot.currentBid = bidAmountToPlace;
            currentLot.highestReserveBid = maxBid;
            currentLot.reserveBidder = userId;
          } else {
            auction.bids.push({
              user: userId,
              amount: bidAmountToPlace,
              maxBid: maxBid,
              isReserveBidder: true,
              isAutoBid: false,
              isCatalogBid: isInCatalogPhase,
              ipAddress,
              userAgent
            });
          }
          auction.currentBid = bidAmountToPlace;
          auction.totalBids = auction.bids.length;
          auction.highestReserveBid = maxBid;
          auction.reserveBidder = userId;

          console.log(`✅ NORMAL RESERVE PLACED: Current ₹${bidAmountToPlace}, Reserve ₹${maxBid}`);
        }
      }
    } else {
      // Normal bid without reserve bid

      // IMPORTANT: Store previous current bid BEFORE placing new bid (for auto-bid logic)
      const previousCurrentBid = (auction.isLotBidding && currentLot)
        ? (currentLot.currentBid || 0)
        : (auction.currentBid || 0);

      if (auction.isLotBidding && currentLot) {
        // LOT BIDDING: Place bid in current lot's bids array
        currentLot.bids.push({
          user: userId,
          amount,
          isCatalogBid: isInCatalogPhase,
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
          isAutoBid: false,
          isCatalogBid: isInCatalogPhase
        });
      }

      auction.currentBid = amount;
      auction.totalBids = auction.bids.length;

      // AUTO-BID LOGIC: Check if there's an active reserve bidder who should auto-bid
      // IMPORTANT: Use lot-level reserve for lot bidding!
      if (existingHighestReserveBid && existingReserveBidder && existingReserveBidder.toString() !== userId.toString()) {
        // There's a reserve bidder (not the current bidder)
        console.log(`🎯 Normal bid auto-bid check: existingReserve=₹${existingHighestReserveBid}, bidder=${existingReserveBidder}, previousBid=₹${previousCurrentBid}, newBid=₹${amount}, lotNumber=${lotNumber}`);

        // NEW LOGIC: Reserve bidder should compete if their reserve is higher than the PREVIOUS bid
        // This reveals their max even if they can't beat the new bid (like eBay proxy bidding)
        if (existingHighestReserveBid > previousCurrentBid) {
          const increment = auction.getCurrentIncrement();

          // Calculate target: Try to beat new bid OR bid up to reserve max, whichever is LOWER
          const targetToBeatNewBid = amount + increment;
          const autoBidAmount = Math.min(targetToBeatNewBid, existingHighestReserveBid);

          console.log(`💡 Reserve reveal logic: target=₹${targetToBeatNewBid}, reserveMax=₹${existingHighestReserveBid}, autoBid=₹${autoBidAmount}`);

          // Reserve bidder competes up to their max
          const reserveBidderUser = await User.findById(existingReserveBidder);

          if (reserveBidderUser && reserveBidderUser.auctionCoins >= autoBidAmount) {
            // Place auto-bid for reserve bidder

            if (auction.isLotBidding && currentLot) {
              // LOT BIDDING: Auto-bid in current lot
              currentLot.bids.push({
                user: existingReserveBidder,
                amount: autoBidAmount,
                maxBid: existingHighestReserveBid,
                isReserveBidder: true,
                isAutoBid: true,
                isCatalogBid: isInCatalogPhase,
                timestamp: new Date(),
                ipAddress,
                userAgent
              });
              currentLot.currentBid = autoBidAmount;
            } else {
              // NORMAL AUCTION: Auto-bid in main bids array
              auction.bids.push({
                user: existingReserveBidder,
                amount: autoBidAmount,
                maxBid: existingHighestReserveBid,
                isReserveBidder: true,
                isAutoBid: true,
                isCatalogBid: isInCatalogPhase,
                ipAddress,
                userAgent
              });
            }

            auction.currentBid = autoBidAmount;
            auction.totalBids = auction.bids.length;
            autoBidTriggered = true;

            // Now freeze the reserve bidder's coins for the auto-bid
            if (auction.isLotBidding) {
              // LOT BIDDING: Use per-lot freeze for auto-bid
              const freezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
              await freezeCoinsForLot(existingReserveBidder, auction._id, freezeLotNumber, autoBidAmount);
              console.log(`💰 Auto-bid LOT ${freezeLotNumber}: Froze ${autoBidAmount} coins for reserve bidder ${existingReserveBidder}`);
            } else {
              // NORMAL AUCTION: Use old freeze logic
              reserveBidderUser.auctionCoins -= autoBidAmount;
              reserveBidderUser.frozenCoins = autoBidAmount;
              await reserveBidderUser.save();
              console.log(`💰 Auto-bid: Froze ${autoBidAmount} coins for reserve bidder ${reserveBidderUser._id}. Available: ${reserveBidderUser.auctionCoins}, Frozen: ${reserveBidderUser.frozenCoins}`);
            }
          }
        } else if (amount >= existingHighestReserveBid) {
          // This bid has exceeded the reserve bid
          // Clear the reserve bid since it's been overtaken
          console.log(`🎯 Bid ₹${amount} exceeded reserve ₹${existingHighestReserveBid}, clearing reserve for lot ${lotNumber}`);
          auction.highestReserveBid = null;
          auction.reserveBidder = null;

          // Also clear lot-level reserve for lot bidding
          if (auction.isLotBidding && currentLot) {
            currentLot.highestReserveBid = null;
            currentLot.reserveBidder = null;
          }
        }
      }
    }

    // FREEZE/UNFREEZE LOGIC
    // Declare variables OUTSIDE the if block so they're accessible later
    let outbidUserId = null;
    let outbidUserNewBalance = null;

    // IMPORTANT: Skip if auto-bid was triggered, because we already handled freeze/unfreeze in auto-bid logic
    if (!autoBidTriggered) {
      // Find who was leading before this bid
      let bidsBeforeThis;
      if (auction.isLotBidding && currentLot) {
        // LOT BIDDING: Check previous bids in current lot
        bidsBeforeThis = currentLot.bids.slice(0, -1);
      } else {
        // NORMAL AUCTION: Check previous bids in main array
        bidsBeforeThis = auction.bids.slice(0, -1);
      }

    if (bidsBeforeThis.length > 0) {
      const sortedPrevBids = [...bidsBeforeThis].sort((a, b) => b.amount - a.amount);
      const previousHighestBid = sortedPrevBids[0];

      // Unfreeze previous leader's coins (they got outbid)
      // Skip if previous bid was a system bid (no user) or if it's the same user
      if (previousHighestBid && previousHighestBid.user && previousHighestBid.user.toString() !== userId.toString()) {
        const io = req.app.get('io');

        if (auction.isLotBidding) {
          // LOT BIDDING: Use per-lot unfreeze
          // CATALOG PHASE: Use lot user bid on (lotNumber from request)
          // LIVE PHASE: Use current active lot (auction.lotNumber)
          const unfreezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
          const unfreezeResult = await unfreezeCoinsForLot(previousHighestBid.user, auction._id, unfreezeLotNumber);
          if (unfreezeResult.success && unfreezeResult.unfrozenAmount > 0) {
            console.log(`🔓 LOT ${unfreezeLotNumber}: Unfroze ${unfreezeResult.unfrozenAmount} coins for outbid user ${previousHighestBid.user}`);
            outbidUserId = previousHighestBid.user.toString();
            outbidUserNewBalance = unfreezeResult.user.auctionCoins;

            // REAL-TIME: Emit coin balance update to outbid user
            if (io) {
              const outbidData = {
                auctionCoins: unfreezeResult.user.auctionCoins,
                frozenCoins: unfreezeResult.user.frozenCoins,
                reason: 'Outbid - coins refunded',
                lotNumber: unfreezeLotNumber,
                auctionId: auction._id.toString()
              };
              console.log(`💰 REGULAR OUTBID: Emitting to room 'user-${previousHighestBid.user.toString()}' with data:`, JSON.stringify(outbidData, null, 2));
              io.to(`user-${previousHighestBid.user.toString()}`).emit('coin-balance-updated', outbidData);
              console.log(`✅ REGULAR OUTBID: Event emitted successfully`);
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
    } else {
      console.log(`⏭️  SKIP FREEZE/UNFREEZE: Auto-bid already handled freeze/unfreeze logic`);
    }

    // Update lastBidTime for Going, Going, Gone timer
    auction.lastBidTime = new Date();

    await auction.save();

    // RESERVE PRICE AUTO-BIDDING: Trigger system auto-bid to push toward reserve price
    // Works in BOTH catalog and live phases
    if (isInCatalogPhase || isInLivePhase) {
      // Use the lot that user just bid on (currentLotIndex), not the auction's active lot
      const lotIndexForSystemBid = auction.isLotBidding ? currentLotIndex : null;
      systemBidPlaced = await placeReservePriceAutoBid(auction, lotIndexForSystemBid);

      if (systemBidPlaced) {
        const phaseText = isInCatalogPhase ? 'catalog' : 'live';
        console.log(`🤖 System auto-bid triggered after user bid in ${phaseText} phase on Lot #${currentLotIndex + 1}`);
        // Save auction again after system bid
        await auction.save();
      }
    }

    // Freeze the full bid amount (UNLESS user was outbid by auto-bid OR system reserve bid)
    const freezeAmount = amount;

    // Check if auto-bid triggered and outbid the current user (proxy bid OR system reserve bid)
    if (autoBidTriggered || systemBidPlaced) {
      // Check if user is still the winner (reserve bidder) or got outbid
      // Use lot-level for lot bidding!
      const currentReserveBidder = (auction.isLotBidding && currentLot) ? currentLot.reserveBidder : auction.reserveBidder;
      const isUserStillWinner = currentReserveBidder && currentReserveBidder.toString() === userId.toString();

      if (isUserStillWinner) {
        // User WON via auto-bidding - DON'T send outbid notification!
        const currentHighestReserve = (auction.isLotBidding && currentLot) ? currentLot.highestReserveBid : auction.highestReserveBid;
        console.log(`✅ AUTO-BID WIN: User ${userId} won via auto-bidding at ₹${auction.currentBid}, reserve: ₹${currentHighestReserve}`);
        // Freeze coins for the winning auto-bid
        if (auction.isLotBidding) {
          const freezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
          await freezeCoinsForLot(userId, auction._id, freezeLotNumber, auction.currentBid);
          console.log(`🔒 LOT ${freezeLotNumber}: Froze ${auction.currentBid} coins for winning bidder ${userId}`);
        }
      } else {
        // User got outbid by auto-bid - send outbid notification
        console.log(`🚨 AUTO-BID OUTBID: User ${userId} was immediately outbid by auto-bid, skipping freeze and sending notification`);

        const io = req.app.get('io');
        const freezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);

        if (io) {
          const outbidData = {
            auctionCoins: user.auctionCoins, // No change in coins since we didn't freeze
            frozenCoins: 0,
            reason: 'Outbid - coins refunded',
            lotNumber: auction.isLotBidding ? freezeLotNumber : undefined,
            auctionId: auction._id.toString()
          };

          console.log(`💰 AUTO-BID OUTBID: Emitting to room 'user-${userId.toString()}' with data:`, JSON.stringify(outbidData, null, 2));
          io.to(`user-${userId.toString()}`).emit('coin-balance-updated', outbidData);
          console.log(`✅ AUTO-BID OUTBID: Event emitted successfully`);
        }
      }
    } else {
      // Normal bid - freeze the coins
      if (auction.isLotBidding) {
        // LOT BIDDING: Use per-lot freeze
        // CATALOG PHASE: Use lot user bid on (lotNumber from request)
        // LIVE PHASE: Use current active lot (auction.lotNumber)
        const freezeLotNumber = (isInCatalogPhase && lotNumber) ? lotNumber : (auction.lotNumber || 1);
        await freezeCoinsForLot(userId, auction._id, freezeLotNumber, freezeAmount);
        console.log(`🔒 LOT ${freezeLotNumber}: Froze ${freezeAmount} coins for user ${userId}`);

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
            lotNumber: freezeLotNumber,
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
    }

    // Populate the latest bid user info
    await auction.populate('bids.user', 'name email');

    // FOR LOT BIDDING: Also populate user info in lot-level bids
    if (auction.isLotBidding && auction.lots && auction.lots.length > 0) {
      await auction.populate('lots.bids.user', 'name email');
    }

    // Get Socket.io instance and emit real-time update
    const io = req.app.get('io');
    if (io) {
      // Deep convert Mongoose document to plain object (handles nested arrays properly)
      const auctionObject = JSON.parse(JSON.stringify(auction));

      console.log('📡 BACKEND - Emitting bid-placed event:', {
        auctionId: auction._id,
        room: `auction-${auction._id}`,
        isLotBidding: auction.isLotBidding,
        lotCount: auctionObject.lots?.length,
        firstLotBids: auctionObject.lots?.[0]?.bids?.length,
        serializedProperly: typeof auctionObject === 'object' && !auctionObject._doc
      });

      // Get latest bid from appropriate location (lot-level or auction-level)
      let latestBid;
      if (auction.isLotBidding && currentLot && currentLot.bids && currentLot.bids.length > 0) {
        latestBid = currentLot.bids[currentLot.bids.length - 1];
      } else {
        latestBid = auction.bids[auction.bids.length - 1];
      }

      // Emit to all users in this auction room
      io.to(`auction-${auction._id}`).emit('bid-placed', {
        auction: auctionObject,
        latestBid,
        autoBidTriggered,
        previousReserveBidAmount,
        outbidUser: outbidUserId ? {
          userId: outbidUserId,
          newBalance: outbidUserNewBalance
        } : null
      });

      // Emit to admin bid tracking room for real-time admin updates
      // Check if auction/lot has ended to determine status
      const endTime = auction.isLotBidding
        ? (currentLot?.endTime ? new Date(currentLot.endTime) : new Date(auction.endTime))
        : new Date(auction.endTime);
      const isEnded = endTime < new Date();
      const bidStatus = (isEnded && true) ? 'winner' : 'bid_placed'; // New bids are winning initially

      io.to('admin-bid-tracking').emit('new-bid', {
        _id: latestBid._id,
        bidId: latestBid._id,
        auctionId: auction._id,
        auctionTitle: auction.title,
        lotNumber: auction.isLotBidding ? (currentLot?.lotNumber || null) : null,
        lotTitle: auction.isLotBidding ? (currentLot?.title || null) : null,
        bidder: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        amount: latestBid.amount,
        maxBid: latestBid.maxBid,
        timestamp: latestBid.timestamp,
        ipAddress: latestBid.ipAddress,
        userAgent: latestBid.userAgent,
        isWinning: true, // New bids are always winning initially
        isAutoBid: latestBid.isAutoBid || false,
        isReserveBidder: latestBid.isReserveBidder || false,
        currentWinningBid: auction.isLotBidding ? currentLot.currentBid : auction.currentBid,
        auctionEndTime: endTime,
        isAuctionEnded: isEnded,
        status: bidStatus
      });

      console.log('✅ BACKEND - bid-placed and new-bid events emitted successfully');

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
        systemBidPlaced, // Include system reserve bid flag for frontend
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
      .populate('lots.bids.user', 'name email')  // FOR LOT BIDDING
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
        isWinning: getCurrentWinningBid(auction.bids)?.user._id.toString() === userId.toString()
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

// @desc    Get all bids across all auctions (for admin bid tracking)
// @route   GET /api/auctions/admin/bid-tracking
// @access  Admin only
export const getAllBidsForTracking = async (req, res) => {
  try {
    const { 
      auctionId, 
      status, 
      startDate, 
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = {};
    
    if (auctionId) {
      query._id = auctionId;
    }

    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get auctions with bids
    const auctions = await Auction.find(query)
      .populate('bids.user', 'name email')
      .populate('lots.bids.user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Flatten all bids into a single array
    const allBids = [];

    auctions.forEach(auction => {
      // Process auction-level bids (non-lot auctions)
      if (!auction.isLotBidding && auction.bids && auction.bids.length > 0) {
        // Check if auction has ended
        const auctionEndTime = new Date(auction.endTime);
        const isAuctionEnded = auctionEndTime < new Date();

        // Sort bids by amount (descending) to find who outbid whom
        const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);

        auction.bids.forEach(bid => {
          // Only include bids with IP address (new bids from today onwards)
          if (bid.ipAddress) {
            const isWinningBid = bid.amount === auction.currentBid;

            // Find who outbid this bid (next higher bid)
            let outbidBy = null;
            if (!isWinningBid) {
              const higherBids = sortedBids.filter(b => b.amount > bid.amount && b.user);
              if (higherBids.length > 0) {
                const outbidder = higherBids[higherBids.length - 1]; // Get the lowest higher bid
                outbidBy = outbidder.user ? {
                  name: outbidder.user.name,
                  amount: outbidder.amount
                } : null;
              }
            }

            // Determine status based on auction state
            // Only show "winner" if auction ended AND bid is winning
            // Otherwise show "bid_placed" for all other cases (active or ended but not winning)
            const bidStatus = (isAuctionEnded && isWinningBid) ? 'winner' : 'bid_placed';

            allBids.push({
              _id: bid._id,
              auctionId: auction._id,
              auctionTitle: auction.title,
              lotNumber: null,
              bidder: bid.user ? {
                id: bid.user._id,
                name: bid.user.name,
                email: bid.user.email
              } : { name: 'System Bid', email: 'N/A' },
              amount: bid.amount,
              maxBid: bid.maxBid,
              timestamp: bid.timestamp,
              ipAddress: bid.ipAddress || 'Not tracked',
              userAgent: bid.userAgent || 'Not tracked',
              isAutoBid: bid.isAutoBid || false,
              isReserveBidder: bid.isReserveBidder || false,
              isCatalogBid: bid.isCatalogBid || false,
              currentWinningBid: auction.currentBid,
              isWinning: isWinningBid,
              auctionEndTime: auction.endTime,
              isAuctionEnded: isAuctionEnded,
              status: bidStatus,
              outbidBy: outbidBy
            });
          }
        });
      }

      // Process lot-level bids
      if (auction.isLotBidding && auction.lots) {
        auction.lots.forEach(lot => {
          if (lot.bids && lot.bids.length > 0) {
            // Check if lot has ended (check lot's individual endTime)
            const lotEndTime = lot.endTime ? new Date(lot.endTime) : new Date(auction.endTime);
            const isLotEnded = lotEndTime < new Date();

            // Sort bids by amount (descending) to find who outbid whom
            const sortedBids = [...lot.bids].sort((a, b) => b.amount - a.amount);

            lot.bids.forEach(bid => {
              // Only include bids with IP address
              if (bid.ipAddress) {
                const isWinningBid = bid.amount === lot.currentBid;

                // Find who outbid this bid (next higher bid)
                let outbidBy = null;
                if (!isWinningBid) {
                  const higherBids = sortedBids.filter(b => b.amount > bid.amount && b.user);
                  if (higherBids.length > 0) {
                    const outbidder = higherBids[higherBids.length - 1]; // Get the lowest higher bid
                    outbidBy = outbidder.user ? {
                      name: outbidder.user.name,
                      amount: outbidder.amount
                    } : null;
                  }
                }

                // Determine status: only "winner" if lot ended AND bid is winning
                const bidStatus = (isLotEnded && isWinningBid) ? 'winner' : 'bid_placed';

                allBids.push({
                  _id: bid._id,
                  auctionId: auction._id,
                  auctionTitle: auction.title,
                  lotNumber: lot.lotNumber,
                  lotTitle: lot.title,
                  bidder: bid.user ? {
                    id: bid.user._id,
                    name: bid.user.name,
                    email: bid.user.email
                  } : { name: 'System Bid', email: 'N/A' },
                  amount: bid.amount,
                  maxBid: bid.maxBid,
                  timestamp: bid.timestamp,
                  ipAddress: bid.ipAddress || 'Not tracked',
                  userAgent: bid.userAgent || 'Not tracked',
                  isAutoBid: bid.isAutoBid || false,
                  isReserveBidder: bid.isReserveBidder || false,
                  isCatalogBid: bid.isCatalogBid || false,
                  isSystemBid: bid.isSystemBid || false,
                  currentWinningBid: lot.currentBid,
                  isWinning: isWinningBid,
                  auctionEndTime: lotEndTime,
                  isAuctionEnded: isLotEnded,
                  status: bidStatus,
                  outbidBy: outbidBy
                });
              }
            });
          }
        });
      }
    });

    // Sort by timestamp (newest first)
    allBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply status filter after flattening
    let filteredBids = allBids;
    if (status === 'winner') {
      filteredBids = allBids.filter(bid => bid.status === 'winner');
    } else if (status === 'bid_placed') {
      filteredBids = allBids.filter(bid => bid.status === 'bid_placed');
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBids = filteredBids.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        bids: paginatedBids,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredBids.length / limit),
          totalBids: filteredBids.length,
          bidsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all bids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bid tracking data',
      error: error.message
    });
  }
};
