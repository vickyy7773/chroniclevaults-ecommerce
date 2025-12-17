import express from 'express';
import {
  transferLots,
  assignUnsoldLots,
  getAuctionUnsoldLots,
  getAuctionBuyersWithLots,
  getAllBuyers
} from '../controllers/lotTransferController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authorization
router.use(protect);
router.use(admin);

// @route   POST /api/lot-transfer/transfer
// @desc    Transfer lots from one buyer to another
// @access  Admin
router.post('/transfer', transferLots);

// @route   POST /api/lot-transfer/assign-unsold
// @desc    Manually assign unsold lots to a buyer
// @access  Admin
router.post('/assign-unsold', assignUnsoldLots);

// @route   GET /api/lot-transfer/unsold/:auctionId
// @desc    Get all unsold lots for an auction
// @access  Admin
router.get('/unsold/:auctionId', getAuctionUnsoldLots);

// @route   GET /api/lot-transfer/buyers/:auctionId
// @desc    Get all buyers with their lots for specific auction
// @access  Admin
router.get('/buyers/:auctionId', getAuctionBuyersWithLots);

// @route   GET /api/lot-transfer/all-buyers
// @desc    Get all registered buyers from all auctions
// @access  Admin
router.get('/all-buyers', getAllBuyers);

export default router;
