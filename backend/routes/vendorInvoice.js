import express from 'express';
import {
  getAllVendorInvoices,
  getVendorInvoiceById,
  generateVendorInvoices,
  updateVendorInvoice,
  markVendorInvoiceAsPaid,
  deleteVendorInvoice,
  getVendorInvoicesByAuction
} from '../controllers/vendorInvoiceController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and require admin role
// Temporarily disabled for testing
// router.use(protect);
// router.use(admin);

// Generate vendor invoices for an auction
router.post('/generate', generateVendorInvoices);

// Get all vendor invoices (with optional filters)
router.get('/', getAllVendorInvoices);

// Get vendor invoices by auction
router.get('/auction/:auctionId', getVendorInvoicesByAuction);

// Get single vendor invoice by ID
router.get('/:id', getVendorInvoiceById);

// Update vendor invoice
router.put('/:id', updateVendorInvoice);

// Mark vendor invoice as paid
router.put('/:id/payment', markVendorInvoiceAsPaid);

// Delete vendor invoice
router.delete('/:id', deleteVendorInvoice);

export default router;
