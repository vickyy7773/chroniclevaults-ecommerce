import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false // Made optional - auctions can be standalone
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentBid: {
    type: Number,
    required: true,
    default: function() {
      return this.startingPrice;
    }
  },
  reservePrice: {
    type: Number,
    default: null // Optional reserve price
  },
  incrementSlabs: [{
    minPrice: {
      type: Number,
      required: true
    },
    maxPrice: {
      type: Number,
      required: true
    },
    increment: {
      type: Number,
      required: true
    }
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Active', 'Ended', 'Cancelled'],
    default: 'Upcoming'
  },
  bids: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    maxBid: {
      type: Number,
      default: null // User's maximum autobid amount
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isReserveBidder: {
      type: Boolean,
      default: false
    },
    isAutoBid: {
      type: Boolean,
      default: false // True if this bid was placed automatically
    }
  }],
  reserveBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  highestReserveBid: {
    type: Number,
    default: null // Current highest reserve bid (hidden from users)
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  totalBids: {
    type: Number,
    default: 0
  },
  lastBidTime: {
    type: Date,
    default: null // Track when last bid was placed for Going, Going, Gone timer
  },
  warningCount: {
    type: Number,
    default: 0 // 0 = no warning, 1 = going once, 2 = going twice, 3 = sold
  },
  isGoingGoingGoneEnabled: {
    type: Boolean,
    default: true // Enable/disable Going, Going, Gone feature per auction
  },
  // Sequential Lot Bidding Fields
  isLotBidding: {
    type: Boolean,
    default: false // Is this a lot-based auction?
  },
  lotNumber: {
    type: Number,
    default: null // Current lot number (1, 2, 3, etc.)
  },
  totalLots: {
    type: Number,
    default: 1 // Total number of lots in this auction
  },
  lotDuration: {
    type: Number,
    default: 10 // Duration for each lot in minutes
  },
  currentLotStartTime: {
    type: Date,
    default: null // When current lot started
  },
  currentLotEndTime: {
    type: Date,
    default: null // When current lot will end
  },
  lots: [{
    lotNumber: Number,
    title: String,
    description: String,
    image: String,
    startingPrice: Number,
    currentBid: Number,
    bids: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Active', 'Ended'],
      default: 'Upcoming'
    },
    startTime: Date,
    endTime: Date
  }]
}, {
  timestamps: true
});

// Virtual for auction number
auctionSchema.virtual('auctionNumber').get(function() {
  return `AUC-${this._id.toString().slice(-6).toUpperCase()}`;
});

// Method to get current increment based on current bid
auctionSchema.methods.getCurrentIncrement = function() {
  const currentBid = this.currentBid;

  for (let slab of this.incrementSlabs) {
    if (currentBid >= slab.minPrice && currentBid < slab.maxPrice) {
      return slab.increment;
    }
  }

  // If no slab matches, return the last slab's increment
  return this.incrementSlabs[this.incrementSlabs.length - 1]?.increment || 50;
};

// Method to validate bid amount
auctionSchema.methods.validateBid = function(bidAmount) {
  // Check if bid is divisible by 50
  if (bidAmount % 50 !== 0) {
    return { valid: false, message: 'Bid amount must be divisible by 50' };
  }

  const currentIncrement = this.getCurrentIncrement();
  const minBid = this.currentBid + currentIncrement;

  // Check if bid meets minimum requirement
  if (bidAmount < minBid) {
    return {
      valid: false,
      message: `Bid must be at least ₹${minBid.toLocaleString()} (current bid + increment of ₹${currentIncrement.toLocaleString()})`
    };
  }

  return { valid: true, message: 'Valid bid' };
};

// Update auction status based on time
auctionSchema.methods.updateStatus = async function() {
  const now = new Date();
  const previousStatus = this.status;

  if (now < this.startTime) {
    this.status = 'Upcoming';
  } else if (now >= this.startTime && now < this.endTime) {
    this.status = 'Active';
  } else if (now >= this.endTime) {
    this.status = 'Ended';

    // Set winner if auction ended and has bids
    if (this.bids.length > 0 && !this.winner) {
      const highestBid = this.bids[this.bids.length - 1];
      this.winner = highestBid.user;

      // Handle frozen coins when auction ends (first time only)
      if (previousStatus !== 'Ended') {
        await this.settleFrozenCoins();
      }
    }
  }

  return this.status;
};

// Settle frozen coins when auction ends
auctionSchema.methods.settleFrozenCoins = async function() {
  try {
    const User = mongoose.model('User');

    // Get all unique bidders
    const bidderIds = [...new Set(this.bids.map(bid => bid.user.toString()))];

    // Get winner ID
    const winnerId = this.winner ? this.winner.toString() : null;

    console.log(`🏁 Settling frozen coins for auction ${this._id}`);
    console.log(`👑 Winner: ${winnerId}`);
    console.log(`👥 Total bidders: ${bidderIds.length}`);

    for (const bidderId of bidderIds) {
      const user = await User.findById(bidderId);

      if (!user) continue;

      if (bidderId === winnerId) {
        // Winner: Keep frozen coins as deducted (already frozen)
        console.log(`💰 Winner ${user.email}: Frozen ${user.frozenCoins} coins will be deducted`);
        user.frozenCoins = 0; // Clear frozen amount (coins already removed from available)
      } else {
        // Losers: Return frozen coins to available balance
        if (user.frozenCoins > 0) {
          console.log(`🔓 Loser ${user.email}: Returning ${user.frozenCoins} frozen coins`);
          user.auctionCoins += user.frozenCoins;
          user.frozenCoins = 0;
        }
      }

      await user.save();
    }

    console.log(`✅ Frozen coins settled for auction ${this._id}`);
  } catch (error) {
    console.error('Error settling frozen coins:', error);
  }
};

// Index for faster queries
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ product: 1 });

export default mongoose.model('Auction', auctionSchema);
