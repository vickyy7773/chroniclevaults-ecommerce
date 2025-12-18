import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  getAuctionVendors,
  transferLots
} from '../controllers/vendorLotTransferController.js';

const router = express.Router();

// All routes are admin-protected
router.use(protect);
router.use(admin);

/**
 * @route   GET /api/vendor-lot-transfer/auction-vendors/:auctionId
 * @desc    Get all vendors from a specific auction (for lot transfer)
 * @access  Private/Admin
 */
router.get('/auction-vendors/:auctionId', getAuctionVendors);

/**
 * @route   POST /api/vendor-lot-transfer/transfer
 * @desc    Transfer specific lots from one vendor to another
 * @access  Private/Admin
 */
router.post('/transfer', transferLots);

export default router;
