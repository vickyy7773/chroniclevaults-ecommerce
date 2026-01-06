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
import PDFDocument from 'pdfkit';

const router = express.Router();

// PDF download route - accessible to buyers (not just admins)
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const invoice = await AuctionInvoice.findById(req.params.id)
      .populate('auction', 'title auctionNumber')
      .populate('buyer', 'name email phone');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if user is the buyer or an admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isBuyer = invoice.buyer && invoice.buyer._id.toString() === req.user._id.toString();

    if (!isAdmin && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this invoice'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add invoice content
    doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(12);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`);
    doc.text(`Auction: ${invoice.auction?.auctionNumber || invoice.auction?.title || 'N/A'}`);
    doc.moveDown();

    // Buyer details
    doc.fontSize(14).text('Buyer Details:', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${invoice.buyerDetails?.name || 'N/A'}`);
    doc.text(`Email: ${invoice.buyerDetails?.email || 'N/A'}`);
    doc.text(`Phone: ${invoice.buyerDetails?.phone || 'N/A'}`);
    if (invoice.buyerDetails?.gstin) {
      doc.text(`GSTIN: ${invoice.buyerDetails.gstin}`);
    }
    doc.moveDown();

    // Billing address
    if (invoice.billingAddress) {
      doc.fontSize(14).text('Billing Address:', { underline: true });
      doc.fontSize(12);
      doc.text(invoice.billingAddress.street || '');
      doc.text(`${invoice.billingAddress.city || ''}, ${invoice.billingAddress.state || ''} - ${invoice.billingAddress.pincode || ''}`);
      doc.moveDown();
    }

    // Items table header
    doc.fontSize(14).text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Lot numbers
    doc.fontSize(12);
    doc.text(`Lot Numbers: ${invoice.lotNumbers?.join(', ') || 'N/A'}`);
    doc.moveDown();

    // Financial details
    doc.fontSize(14).text('Amount Details:', { underline: true });
    doc.fontSize(12);
    doc.text(`Subtotal: ₹${invoice.subtotal?.toLocaleString('en-IN') || '0'}`);
    doc.text(`Tax: ₹${invoice.taxAmount?.toLocaleString('en-IN') || '0'}`);
    doc.text(`Grand Total: ₹${(invoice.totalAfterGst || invoice.grandTotal || 0).toLocaleString('en-IN')}`, {
      fontSize: 14,
      bold: true
    });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating invoice PDF:', error);

    // If headers not sent, send error JSON
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating PDF'
      });
    }
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
