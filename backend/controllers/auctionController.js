import Auction from '../models/Auction.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

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
      auction.updateStatus();
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
    auction.updateStatus();
    await auction.save();

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
      incrementSlabs,
      startTime,
      endTime
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

    // Image is required if no product is linked
    if (!image && !product) {
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

    const auction = new Auction({
      product: isValidProductId ? productId : null,
      title,
      description,
      image: image || (product ? product.images[0] : null),
      startingPrice,
      currentBid: startingPrice,
      reservePrice,
      incrementSlabs: defaultSlabs,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    // Set initial status
    auction.updateStatus();

    const savedAuction = await auction.save();

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
        auction[field] = req.body[field];
      }
    });

    // Update status based on time
    auction.updateStatus();

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
    auction.updateStatus();

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

    // Calculate coin deduction (only the increment, not full bid)
    const previousBid = auction.currentBid;
    const coinDeduction = amount - previousBid;

    // Check if user has enough coins for the increment
    if (user.auctionCoins < coinDeduction) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You have ${user.auctionCoins.toLocaleString()} coins but need ${coinDeduction.toLocaleString()} coins for this bid`
      });
    }

    // Validate bid amount
    const validation = auction.validateBid(amount);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
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
        auction.bids.push({
          user: userId,
          amount,
          maxBid: maxBid,
          isReserveBidder: false,
          isAutoBid: false
        });

        auction.currentBid = amount;
        auction.totalBids = auction.bids.length;
      } else {
        // User's reserve bid is higher than existing reserve bid (or no existing reserve bid)
        // First, place the current bid
        auction.bids.push({
          user: userId,
          amount,
          maxBid: maxBid,
          isReserveBidder: false,
          isAutoBid: false
        });

        auction.currentBid = amount;
        auction.totalBids = auction.bids.length;

        // If there was a previous reserve bid, automatically jump to that amount
        if (auction.highestReserveBid && auction.highestReserveBid > amount) {
          previousReserveBidAmount = auction.highestReserveBid;

          // Auto-increment to the previous reserve bid amount
          auction.bids.push({
            user: userId,
            amount: auction.highestReserveBid,
            maxBid: maxBid,
            isReserveBidder: false,
            isAutoBid: true
          });

          auction.currentBid = auction.highestReserveBid;
          auction.totalBids = auction.bids.length;
          autoBidTriggered = true;
        }

        // Update the highest reserve bid and reserve bidder
        auction.highestReserveBid = maxBid;
        auction.reserveBidder = userId;
      }
    } else {
      // Normal bid without reserve bid
      auction.bids.push({
        user: userId,
        amount,
        maxBid: null,
        isReserveBidder: false,
        isAutoBid: false
      });

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
          const autoBidCoinDeduction = increment;

          if (reserveBidderUser && reserveBidderUser.auctionCoins >= autoBidCoinDeduction) {
            // Place auto-bid for reserve bidder
            auction.bids.push({
              user: auction.reserveBidder,
              amount: autoBidAmount,
              maxBid: auction.highestReserveBid,
              isReserveBidder: true,
              isAutoBid: true
            });

            auction.currentBid = autoBidAmount;
            auction.totalBids = auction.bids.length;
            autoBidTriggered = true;

            // Deduct coins from reserve bidder
            reserveBidderUser.auctionCoins -= autoBidCoinDeduction;
            await reserveBidderUser.save();
            console.log(`💰 Auto-bid: Deducted ${autoBidCoinDeduction} coins from reserve bidder ${reserveBidderUser._id}. Remaining: ${reserveBidderUser.auctionCoins}`);
          }
        } else if (amount >= auction.highestReserveBid) {
          // This bid has exceeded the reserve bid
          // Clear the reserve bid since it's been overtaken
          auction.highestReserveBid = null;
          auction.reserveBidder = null;
        }
      }
    }

    await auction.save();

    // Deduct only the increment coins from user
    user.auctionCoins -= coinDeduction;
    await user.save();
    console.log(`💰 Deducted ${coinDeduction} coins (increment) from user ${user._id}. Remaining: ${user.auctionCoins}`);

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
        previousReserveBidAmount
      });
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
