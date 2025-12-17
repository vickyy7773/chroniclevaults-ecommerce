import express from 'express';
import {
  transferLots,
  assignUnsoldLots,
  getAuctionUnsoldLots,
  getAuctionBuyersWithLots
} from '../controllers/lotTransferController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin', 'superadmin'));

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
// @desc    Get all buyers with their lots
// @access  Admin
router.get('/buyers/:auctionId', getAuctionBuyersWithLots);

export default router;
