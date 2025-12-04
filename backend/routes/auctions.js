import express from 'express';
import {
  getAllAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  placeBid,
  getUserBids,
  setReserveBidder,
  addBulkLots,
  getPriceRealization
} from '../controllers/auctionController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllAuctions);
router.get('/price-realization', getPriceRealization);
router.get('/:id', getAuctionById);

// Protected routes (require authentication)
router.post('/:id/bid', protect, placeBid);
router.get('/my/bids', protect, getUserBids);

// Admin routes (require admin role)
router.post('/', protect, admin, createAuction);
router.put('/:id', protect, admin, updateAuction);
router.delete('/:id', protect, admin, deleteAuction);
router.put('/:id/reserve-bidder', protect, admin, setReserveBidder);
router.post('/:id/bulk-lots', protect, admin, addBulkLots);

export default router;
