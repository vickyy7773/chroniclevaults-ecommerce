import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  createLotAuction,
  getAllLotAuctions,
  getLotAuctionById,
  updateLotAuction,
  deleteLotAuction,
  addLot,
  updateLot,
  deleteLot,
  updateAuctionStatus,
  uploadResults,
  generateInvoices,
  getPublicLotAuctions,
  getPublicLotAuctionById,
  placeBid,
  migrateAuctionToLot,
} from '../controllers/lotAuctionController.js';

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/public', getPublicLotAuctions);
router.get('/public/:id', getPublicLotAuctionById);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.post('/', protect, admin, createLotAuction);
router.get('/admin', protect, admin, getAllLotAuctions);
router.get('/:id', protect, admin, getLotAuctionById);
router.put('/:id', protect, admin, updateLotAuction);
router.delete('/:id', protect, admin, deleteLotAuction);

// Lot management
router.post('/:id/lots', protect, admin, addLot);
router.put('/:id/lots/:lotNumber', protect, admin, updateLot);
router.delete('/:id/lots/:lotNumber', protect, admin, deleteLot);

// Migration: live Auction → LotAuction
router.post('/migrate/:auctionId', protect, admin, migrateAuctionToLot);

// Status & results
router.put('/:id/status', protect, admin, updateAuctionStatus);
router.post('/:id/results', protect, admin, uploadResults);
router.post('/:id/generate-invoices', protect, admin, generateInvoices);

// ─── Authenticated customer route ─────────────────────────────────────────────
router.post('/:id/bid', protect, placeBid);

export default router;
