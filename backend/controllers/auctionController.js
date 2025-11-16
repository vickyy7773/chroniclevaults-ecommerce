import Auction from '../models/Auction.js';
import Product from '../models/Product.js';

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

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Default increment slabs if not provided
    const defaultSlabs = incrementSlabs || [
      { minPrice: 0, maxPrice: 1000, increment: 50 },
      { minPrice: 1000, maxPrice: 5000, increment: 100 },
      { minPrice: 5000, maxPrice: 10000, increment: 250 },
      { minPrice: 10000, maxPrice: 50000, increment: 500 },
      { minPrice: 50000, maxPrice: 100000, increment: 1000 },
      { minPrice: 100000, maxPrice: Infinity, increment: 2000 }
    ];

    const auction = new Auction({
      product: productId,
      title,
      description,
      image: image || product.images[0],
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
    const { amount } = req.body;
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

    // Validate bid amount
    const validation = auction.validateBid(amount);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Check if user is the reserve bidder
    const isReserveBidder = auction.reserveBidder &&
                           auction.reserveBidder.toString() === userId.toString();

    // Add the bid
    auction.bids.push({
      user: userId,
      amount,
      isReserveBidder
    });

    // Update current bid and total bids
    auction.currentBid = amount;
    auction.totalBids = auction.bids.length;

    await auction.save();

    // Populate the latest bid user info
    await auction.populate('bids.user', 'name email');

    res.json({
      success: true,
      message: 'Bid placed successfully',
      data: {
        auction,
        latestBid: auction.bids[auction.bids.length - 1]
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
