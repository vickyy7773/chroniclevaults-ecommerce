import express from 'express';
import {
  createAuctionInvoice,
  getAllAuctionInvoices,
  getAuctionInvoiceById,
  updateAuctionInvoice,
  deleteAuctionInvoice,
  getInvoicesByAuction,
  markInvoiceAsPaid,
  updateInvoiceCommission
} from '../controllers/auctionInvoiceController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(protect, admin);

// Invoice CRUD routes
router.route('/')
  .get(getAllAuctionInvoices)
  .post(createAuctionInvoice);

router.route('/:id')
  .get(getAuctionInvoiceById)
  .put(updateAuctionInvoice)
  .delete(deleteAuctionInvoice);

// Additional routes
router.get('/auction/:auctionId', getInvoicesByAuction);
router.put('/:id/pay', markInvoiceAsPaid);
router.put('/:id/commission', updateInvoiceCommission);

export default router;
