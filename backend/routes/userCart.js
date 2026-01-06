import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Auction from '../models/Auction.js';
import CoinAllocation from '../models/CoinAllocation.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/user/cart
// @desc    Get user's cart
// @access  Private
router.get('/cart', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.product');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/user/cart
// @desc    Add item to cart or update quantity
// @access  Private
router.post('/cart', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);

    // Check if product already in cart
    const existingItemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      user.cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      user.cart.push({
        product: productId,
        quantity,
        addedAt: new Date()
      });
    }

    await user.save();
    await user.populate('cart.product');

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/user/cart/:productId
// @desc    Update cart item quantity
// @access  Private
router.put('/cart/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    const user = await User.findById(req.user._id);
    const itemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    user.cart[itemIndex].quantity = quantity;
    await user.save();
    await user.populate('cart.product');

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/user/cart/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/cart/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(item => item.product.toString() !== productId);

    await user.save();
    await user.populate('cart.product');

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/user/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/cart', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.json({ success: true, cart: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/user/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/user/wishlist/:productId
// @desc    Add item to wishlist
// @access  Private
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);

    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ success: false, message: 'Item already in wishlist' });
    }

    user.wishlist.push(productId);
    await user.save();
    await user.populate('wishlist');

    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/user/wishlist/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);

    await user.save();
    await user.populate('wishlist');

    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/user/sync
// @desc    Sync cart and wishlist from localStorage to database
// @access  Private
router.post('/sync', protect, async (req, res) => {
  try {
    const { cart = [], wishlist = [] } = req.body;

    const user = await User.findById(req.user._id);

    // Sync wishlist - merge unique items
    const existingWishlistIds = user.wishlist.map(id => id.toString());
    const newWishlistItems = wishlist.filter(id => !existingWishlistIds.includes(id));
    user.wishlist.push(...newWishlistItems);

    // Sync cart - merge items
    for (const cartItem of cart) {
      const existingItemIndex = user.cart.findIndex(
        item => item.product.toString() === cartItem.product || item.product.toString() === cartItem._id
      );

      if (existingItemIndex > -1) {
        // Update quantity to max of both
        user.cart[existingItemIndex].quantity = Math.max(
          user.cart[existingItemIndex].quantity,
          cartItem.quantity
        );
      } else {
        // Add new item
        user.cart.push({
          product: cartItem.product || cartItem._id,
          quantity: cartItem.quantity || 1,
          addedAt: new Date()
        });
      }
    }

    await user.save();
    await user.populate('cart.product');
    await user.populate('wishlist');

    res.json({
      success: true,
      cart: user.cart,
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Error syncing cart/wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/user/auction-bidding-info
// @desc    Get user's coin allocation history (date-wise with FIFO usage)
// @access  Private
router.get('/auction-bidding-info', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's frozen coins data
    const user = await User.findById(userId);
    const totalFrozenCoins = user.frozenCoinsPerAuction?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

    // Get all coin allocations for this user, sorted by date (oldest first for FIFO)
    const allocations = await CoinAllocation.find({ userId })
      .sort({ allocationDate: 1 }) // Oldest first for FIFO calculation
      .lean();

    // If no allocations exist, create one from current auctionCoins
    if (allocations.length === 0 && user.auctionCoins > 0) {
      const initialAllocation = await CoinAllocation.create({
        userId,
        amount: user.auctionCoins + totalFrozenCoins,
        notes: 'Initial allocation (auto-created)',
        allocationDate: user.createdAt || new Date()
      });
      allocations.push(initialAllocation);
    }

    const allocationHistory = [];
    let remainingUsage = totalFrozenCoins; // Total coins to distribute using FIFO

    // FIFO: Distribute usage across allocations (oldest first)
    for (const allocation of allocations) {
      let used = 0;
      let remaining = allocation.amount;

      if (remainingUsage > 0) {
        if (remainingUsage >= allocation.amount) {
          // This allocation is fully used
          used = allocation.amount;
          remaining = 0;
          remainingUsage -= allocation.amount;
        } else {
          // This allocation is partially used
          used = remainingUsage;
          remaining = allocation.amount - remainingUsage;
          remainingUsage = 0;
        }
      }

      allocationHistory.push({
        allocationDate: allocation.allocationDate,
        biddingLimit: allocation.amount,
        bidAmount: used,
        remainingLimit: remaining,
        notes: allocation.notes || ''
      });
    }

    // Reverse to show newest first
    allocationHistory.reverse();

    res.json({
      success: true,
      data: allocationHistory
    });

  } catch (error) {
    console.error('Error fetching coin allocation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coin allocation history'
    });
  }
});

// @route   GET /api/user/my-invoices
// @desc    Get user's customer invoices (buyer invoices)
// @access  Private
router.get('/my-invoices', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Import AuctionInvoice model
    const AuctionInvoice = (await import('../models/AuctionInvoice.js')).default;

    // Find all invoices where user is the buyer AND invoice is sent to customer
    const invoices = await AuctionInvoice.find({
      buyer: userId,
      sentToCustomer: true
    })
      .populate('auction', 'title auctionNumber')
      .sort({ invoiceDate: -1 })
      .lean();

    const invoiceData = invoices.map((invoice, index) => {
      // Calculate total amount same as PDF (includes commission + GST on commission)
      const lotsArray = invoice.lots && invoice.lots.length > 0 ? invoice.lots : [];
      const totalHammerPrice = lotsArray.reduce((sum, lot) => sum + (lot?.hammerPrice || 0), 0);
      const commissionRate = invoice.buyerDetails?.commissionPercentage || 12;
      const totalCommission = (totalHammerPrice * commissionRate) / 100;
      const cgstOnCommission = (totalCommission * 9) / 100;
      const sgstOnCommission = (totalCommission * 9) / 100;
      const subtotalWithCommission = totalHammerPrice + totalCommission;
      const cgstOnHammer = (invoice.gst?.cgst || 0);
      const sgstOnHammer = (invoice.gst?.sgst || 0);
      const insuranceAmount = (invoice.insuranceCharges?.amount > 0 && !invoice.insuranceCharges?.declined) ? invoice.insuranceCharges.amount : 0;
      const grandTotal = Math.round(subtotalWithCommission + cgstOnHammer + sgstOnHammer + cgstOnCommission + sgstOnCommission + insuranceAmount);

      return {
        srNo: index + 1,
        auctionId: invoice.auction?._id,
        auctionNo: invoice.auction?.auctionNumber || invoice.auction?.title || 'N/A',
        invoiceNo: invoice.invoiceNumber,
        amount: grandTotal,
        invoiceDate: invoice.invoiceDate,
        pdfUrl: `/auction-invoices/${invoice._id}/pdf`,
        lotNumbers: invoice.lotNumbers
      };
    });

    res.json({
      success: true,
      data: invoiceData
    });

  } catch (error) {
    console.error('Error fetching user invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices'
    });
  }
});

// @route   GET /api/user/my-bidding
// @desc    Get user's bidding history across all auctions
// @access  Private
router.get('/my-bidding', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all auctions that have lots
    const auctions = await Auction.find({
      isLotBidding: true,
      'lots.bids.user': userId
    });

    const biddingHistory = [];
    let srNo = 1;

    // Loop through each auction
    for (const auction of auctions) {
      // Loop through each lot in the auction
      for (const lot of auction.lots) {
        // Find user's bids in this lot
        const userBids = lot.bids.filter(bid =>
          bid.user && bid.user.toString() === userId.toString()
        );

        // Process each bid
        for (const bid of userBids) {
          // Determine bid status
          let bidStatus = 'Bid Placed'; // Default status for all bids

          // Check if lot has ended
          const lotEnded = auction.status === 'Ended' ||
                          (lot.status && lot.status === 'Ended');

          // Get highest bid in this lot
          const highestBid = lot.bids.length > 0
            ? Math.max(...lot.bids.map(b => b.amount))
            : lot.startingPrice;

          // Check if this is the user's latest/highest bid on this lot
          const userLatestBid = userBids.length > 0
            ? Math.max(...userBids.map(b => b.amount))
            : 0;
          const isLatestBid = bid.amount === userLatestBid;

          // Only update status for the latest bid
          if (isLatestBid) {
            // Check if user has the overall highest bid in the lot
            const userHasHighestBid = bid.amount === highestBid;

            if (lotEnded) {
              bidStatus = userHasHighestBid ? 'Won' : 'Out Bid';
            } else {
              // Auction is still active
              if (userHasHighestBid) {
                bidStatus = 'Highest Bid';
              } else {
                // Check if outbid
                const wasOutbid = lot.bids.some(b =>
                  b.amount > bid.amount &&
                  new Date(b.timestamp) > new Date(bid.timestamp)
                );
                bidStatus = wasOutbid ? 'Out Bid' : 'Bid Placed';
              }
            }
          }
          // All other (non-latest) bids remain "Bid Placed"

          biddingHistory.push({
            srNo: srNo++,
            auctionId: auction._id,
            auctionNumber: auction.auctionNumber || auction.title,
            lotNo: lot.lotNumber,
            lotTitle: lot.title,
            myBidAmount: bid.amount,
            maxBidAmount: bid.maxBid || bid.amount,
            bidDateTime: bid.timestamp,
            soldFor: lotEnded && lot.winner ? lot.currentBid : null,
            bidStatus: bidStatus,
            isAutoBid: bid.isAutoBid || false,
            isCatalogBid: bid.isCatalogBid || false
          });
        }
      }
    }

    // Sort by bid date/time (most recent first)
    biddingHistory.sort((a, b) => new Date(b.bidDateTime) - new Date(a.bidDateTime));

    res.json({
      success: true,
      data: biddingHistory
    });

  } catch (error) {
    console.error('Error fetching bidding history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bidding history'
    });
  }
});

export default router;
