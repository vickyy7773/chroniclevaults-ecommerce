import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
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
    timestamp: {
      type: Date,
      default: Date.now
    },
    isReserveBidder: {
      type: Boolean,
      default: false
    }
  }],
  reserveBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  totalBids: {
    type: Number,
    default: 0
  }
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
auctionSchema.methods.updateStatus = function() {
  const now = new Date();

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
    }
  }

  return this.status;
};

// Index for faster queries
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ product: 1 });

export default mongoose.model('Auction', auctionSchema);
