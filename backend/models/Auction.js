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
  // Sequential Lot Bidding - Must be defined before image field for conditional validation
  isLotBidding: {
    type: Boolean,
    default: false // Is this a lot-based auction?
  },
  // Catalog/Pre-Bidding Phase (2-Phase Auction System)
  catalogBiddingEnabled: {
    type: Boolean,
    default: true // Enable catalog browsing phase before live auction (ALWAYS ON)
  },
  image: {
    type: String,
    required: function() {
      // Image is only required if it's NOT lot bidding (lot bidding uses per-lot images)
      return !this.isLotBidding;
    }
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
    required: false // Optional - lot bidding auctions end based on bidding activity
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
    },
    ipAddress: {
      type: String,
      default: null // IP address of the bidder (for admin tracking)
    },
    userAgent: {
      type: String,
      default: null // Browser/device info (for admin tracking)
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
    default: null // Track when last bid was placed for 3-phase timer
  },
  callNumber: {
    type: Number,
    default: 1 // Current phase: 1 = "Going Once", 2 = "Going Twice", 3 = "SOLD/UNSOLD"
  },
  phaseTimer: {
    type: Number,
    default: 10 // 10-second countdown within current phase
  },
  phaseStartTime: {
    type: Date,
    default: null // When current phase started
  },
  isThreePhaseTimerEnabled: {
    type: Boolean,
    default: true // Enable/disable 3-phase (30-second) timer per auction
  },
  // Sequential Lot Bidding Fields (isLotBidding is defined earlier for conditional image validation)
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
    image: String, // Kept for backwards compatibility (will use first image from images array)
    images: {
      type: [String],
      default: function() {
        // If old 'image' field exists, use it as first image
        return this.image ? [this.image] : [];
      }
    },
    video: {
      type: String,
      default: null // Video URL or file path
    },
    category: {
      type: String,
      default: 'Miscellaneous' // Category like "Ancient India", "Mughals", etc.
    },
    material: {
      type: String,
      default: null // Material of the lot (e.g., Gold, Silver, Bronze, Copper, etc.)
    },
    vendorId: {
      type: String,
      default: null // Vendor ID for tracking lot ownership (admin only)
    },
    startingPrice: Number,
    currentBid: Number,
    reservePrice: {
      type: Number,
      default: 0
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    bids: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Not required for system/reserve bids
      },
      amount: Number,
      maxBid: {
        type: Number,
        default: null // Maximum bid amount (for proxy/reserve bidding)
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isReserveBidder: {
        type: Boolean,
        default: false // True if this user has a reserve bid
      },
      isAutoBid: {
        type: Boolean,
        default: false // True if this is an automatic bid
      },
      isSystemBid: {
        type: Boolean,
        default: false // True if this is an automatic reserve price bid
      },
      isCatalogBid: {
        type: Boolean,
        default: false // True if placed during catalog phase (before startTime)
      },
      ipAddress: {
        type: String,
        default: null // IP address of the bidder (for admin tracking)
      },
      userAgent: {
        type: String,
        default: null // Browser/device info (for admin tracking)
      }
    }],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reserveBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // User with highest reserve bid for THIS lot
    },
    highestReserveBid: {
      type: Number,
      default: null // Highest reserve bid for THIS lot (hidden from users)
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Active', 'Sold', 'Unsold', 'Ended'],
      default: 'Upcoming'
    },
    unsoldReason: {
      type: String,
      enum: ['No bids', 'Below reserve price', null],
      default: null
    },
    startTime: Date,
    endTime: Date
  }],

  // Auction Catalog Information
  auctionCode: {
    type: String,
    default: function() {
      return `AUC${Math.floor(Math.random() * 100)}`;
    }
  },
  venue: {
    location: String,
    address: String,
    city: String,
    state: String,
    contactPhone: String
  },
  lotViewing: [{
    startDate: Date,
    endDate: Date,
    time: String,
    location: String,
    notes: String
  }],
  onlineBiddingEndTime: Date,
  buyersPremium: {
    percentage: {
      type: Number,
      default: 15
    },
    gstOnPremium: {
      type: Number,
      default: 18
    },
    gstOnHammer: {
      type: Number,
      default: 5
    },
    totalPremium: {
      type: Number,
      default: 22.70
    },
    hsnCode: {
      type: String,
      default: '9705'
    },
    notes: String
  },
  catalogPDF: String, // URL to catalog PDF
  coverImage: String, // Cover page image
  highlightImage: String, // Auction highlight banner image (shown during live auction)
  errataPDF: String // Auction errata PDF
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

// Method to get next bid amount (current bid + increment)
auctionSchema.methods.getNextBidAmount = function(currentBidAmount) {
  const currentBid = currentBidAmount || this.currentBid;

  for (let slab of this.incrementSlabs) {
    if (currentBid >= slab.minPrice && currentBid < slab.maxPrice) {
      return currentBid + slab.increment;
    }
  }

  // If no slab matches, use the last slab's increment
  const lastIncrement = this.incrementSlabs[this.incrementSlabs.length - 1]?.increment || 50;
  return currentBid + lastIncrement;
};

// Method to validate bid amount
auctionSchema.methods.validateBid = function(bidAmount) {
  // Check if bid is divisible by 50
  if (bidAmount % 50 !== 0) {
    return { valid: false, message: 'Bid amount must be divisible by 50' };
  }

  // Minimum bid is just current bid (or 0 if no bids)
  const minBid = this.currentBid || 0;

  // Check if bid is higher than current bid
  if (bidAmount <= minBid) {
    return {
      valid: false,
      message: `Bid must be greater than current bid of ₹${minBid.toLocaleString()}`
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
  } else if (now >= this.startTime && (!this.endTime || now < this.endTime)) {
    this.status = 'Active';

    // FOR LOT BIDDING: Activate first lot when auction becomes active
    if (this.isLotBidding && this.lots && this.lots.length > 0) {
      const firstLot = this.lots[0];
      if (firstLot.status === 'Upcoming') {
        firstLot.status = 'Active';
        firstLot.startTime = now;
        // endTime removed - lot ends based on bidding activity

        // Set current lot times
        this.currentLotStartTime = now;
        // currentLotEndTime removed - lot ends based on bidding activity
        this.lotNumber = 1;

        console.log(`🎯 Lot 1 activated for auction ${this._id}`);
      }
    }
  } else if (this.endTime && now >= this.endTime) {
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
