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
import AuctionInvoice from '../models/AuctionInvoice.js';

const router = express.Router();

// PDF download route - accessible to buyers (not just admins)
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const invoice = await AuctionInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if user is the buyer or an admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isBuyer = invoice.buyer && invoice.buyer.toString() === req.user._id.toString();

    if (!isAdmin && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this invoice'
      });
    }

    // For now, return a message that PDF generation is not yet implemented
    // TODO: Implement actual PDF generation
    return res.status(501).json({
      success: false,
      message: 'PDF generation is not yet implemented. Please contact admin.'
    });
  } catch (error) {
    console.error('Error fetching invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// All other routes require authentication and admin access
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
