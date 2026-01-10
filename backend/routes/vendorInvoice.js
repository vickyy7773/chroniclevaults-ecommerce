import express from 'express';
import {
  getAllVendorInvoices,
  getVendorInvoiceById,
  generateVendorInvoices,
  updateVendorInvoice,
  markVendorInvoiceAsPaid,
  deleteVendorInvoice,
  getVendorInvoicesByAuction,
  updateCompanyDetailsInAllInvoices
} from '../controllers/vendorInvoiceController.js';
import { protect, admin } from '../middleware/auth.js';
import Vendor from '../models/Vendor.js';
import Auction from '../models/Auction.js';
import VendorInvoice from '../models/VendorInvoice.js';

const router = express.Router();

// PDF Routes (must be before /:id route to avoid conflicts)
// Pre-Sale Vendor Advise PDF - shows estimate & reserve prices
router.get('/vendor/:vendorId/auction/:auctionId/pre-sale-pdf', protect, async (req, res) => {
  try {
    const { vendorId, auctionId } = req.params;

    const vendor = await Vendor.findById(vendorId);
    const auction = await Auction.findById(auctionId);

    if (!vendor || !auction) {
      return res.status(404).json({
        success: false,
        message: 'Vendor or Auction not found'
      });
    }

    // Get vendor's lots from auction - compare vendorId with vendorCode
    const vendorLots = auction.lots.filter(lot => {
      return lot.vendorId && lot.vendorId === vendor.vendorCode;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pre-Sale Vendor Advise - ${vendor.vendorCode}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header-content { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
          .logo { height: 60px; width: auto; }
          .company-info { text-align: left; }
          .company-name { font-size: 16px; font-weight: bold; color: #d35400; }
          .tagline { font-size: 10px; margin: 5px 0; }
          .title { text-align: center; font-size: 14px; font-weight: bold; color: red; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          td, th { border: 1px solid #000; padding: 8px; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
          .vendor-info td { padding: 5px 8px; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .sign-box { text-align: center; }
          .sign-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; padding-top: 5px; }
          .footer { margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; font-size: 9px; }
          .print-button { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 1000; }
          .print-button:hover { background-color: #45a049; }

          /* Print-specific styles */
          @media print {
            .print-button { display: none; }
            body { padding: 10px; }
            .header { page-break-after: avoid; }
            .logo { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .company-name { color: #d35400 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .title { color: red !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            th { background-color: #f0f0f0 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .totals { background-color: #f0f0f0 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            table { page-break-inside: avoid; }
            .signature-section { page-break-before: avoid; margin-top: 30px; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print PDF</button>

        <div class="header">
          <div class="header-content">
            <img src="https://chroniclevaults.com/assets/new%20logo-5e7e59a2.png" alt="Chronicle Vaults Logo" class="logo" />
            <div class="company-info">
              <div class="company-name">Chronicle Vaults - A Brand of Urhistory</div>
              <div class="tagline">16/189, Netajinagar, Meghaninagar, Ahmedabad - 380016, Gujarat</div>
              <div class="tagline">M:- 8460849878, E-mail:- chroniclevaults@gmail.com</div>
            </div>
          </div>
        </div>

        <div class="title">Pre-Sale Vendor Advise</div>

        <table class="vendor-info">
          <tr>
            <td><strong>Vendor Code:</strong> ${vendor.vendorCode}</td>
            <td><strong>Auction No:</strong> ${auction.auctionNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Name:</strong> ${vendor.name}</td>
            <td><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Address:</strong> ${vendor.address || 'N/A'}</td>
            <td><strong>Vendor:</strong> ${auction.title}</td>
          </tr>
          <tr>
            <td><strong>State:</strong> ${vendor.state || 'N/A'} <strong>Pincode:</strong> ${vendor.pincode || 'N/A'}</td>
            <td colspan="2"></td>
          </tr>
          <tr>
            <td><strong>Email:</strong> ${vendor.email || 'N/A'}</td>
            <td><strong>M:-</strong> ${vendor.mobile || 'N/A'}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Sr.NO.</th>
              <th>Lot No.</th>
              <th>Description</th>
              <th>Estimate</th>
              <th>Reserve Price</th>
            </tr>
          </thead>
          <tbody>
            ${vendorLots.length > 0 ? vendorLots.map((lot, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${lot.lotNumber}</td>
                <td>${lot.title}</td>
                <td>₹${(lot.startingPrice || 0).toLocaleString()} - ₹${(lot.reservePrice || lot.estimatedPrice || 0).toLocaleString()}</td>
                <td>₹${(lot.reservePrice || 0).toLocaleString()}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                  No lots found for this vendor in this auction
                </td>
              </tr>
            `}
            ${vendorLots.length > 0 ? `
            <tr>
              <td colspan="3"><strong>Total</strong></td>
              <td colspan="2"></td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sign-box">
            <div>Receiver's Sign :</div>
            <div>Date :</div>
          </div>
          <div class="sign-box">
            <div>For, Chronicle Vaults - A Brand of Urhistory</div>
            <div class="sign-line">Auth. Signatory</div>
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank You for your Participation in our Auction Subject To Ahmedabad Jurisdiction</strong></p>
          <p><strong>GST No:</strong> Chronicle Vaults | <strong>Antiques Trading Licence No:</strong></p>
          <p><strong>Statutory Warning:</strong> Antiques over 100 years old cannot be taken out of India without the permission of the Director General, Archaeological Survey of India, Janpath, New Delhi 110011.</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    console.error('Pre-sale PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating pre-sale PDF'
    });
  }
});

// Post-Sale Vendor Advise PDF - shows sold lots & commission
router.get('/:id/post-sale-pdf', protect, async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id)
      .populate('vendor')
      .populate('auction', 'title auctionNumber endDate');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Vendor invoice not found'
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Post-Sale Vendor Advise - ${invoice.vendorDetails.vendorCode}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header-content { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
          .logo { height: 60px; width: auto; }
          .company-info { text-align: left; }
          .company-name { font-size: 16px; font-weight: bold; color: #d35400; }
          .tagline { font-size: 10px; margin: 5px 0; }
          .title { text-align: center; font-size: 14px; font-weight: bold; color: red; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          td, th { border: 1px solid #000; padding: 8px; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
          .vendor-info td { padding: 5px 8px; }
          .totals { font-weight: bold; background-color: #f0f0f0; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .sign-box { text-align: center; }
          .sign-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; padding-top: 5px; }
          .print-button { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background-color: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 1000; }
          .print-button:hover { background-color: #45a049; }

          /* Print-specific styles */
          @media print {
            .print-button { display: none; }
            body { padding: 10px; }
            .header { page-break-after: avoid; }
            .logo { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .company-name { color: #d35400 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .title { color: red !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            th { background-color: #f0f0f0 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .totals { background-color: #f0f0f0 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            table { page-break-inside: avoid; }
            .signature-section { page-break-before: avoid; margin-top: 30px; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print PDF</button>

        <div class="header">
          <div class="header-content">
            <img src="https://chroniclevaults.com/assets/new%20logo-5e7e59a2.png" alt="Chronicle Vaults Logo" class="logo" />
            <div class="company-info">
              <div class="company-name">Chronicle Vaults - A Brand of Urhistory</div>
              <div class="tagline">16/189, Netajinagar, Meghaninagar, Ahmedabad - 380016, Gujarat</div>
              <div class="tagline">M:- 8460849878, E-mail:- chroniclevaults@gmail.com</div>
            </div>
          </div>
        </div>

        <div class="title">Post-Sale Vendor Advise</div>

        <table class="vendor-info">
          <tr>
            <td><strong>Vendor Code:</strong> ${invoice.vendorDetails.vendorCode}</td>
            <td><strong>Auction No:</strong> ${invoice.auction?.title || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Name:</strong> ${invoice.vendorDetails.name}</td>
            <td><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</td>
          </tr>
          <tr>
            <td><strong>Email:</strong> ${invoice.vendorDetails.email || 'N/A'}</td>
            <td><strong>Mobile:</strong> ${invoice.vendorDetails.mobile || 'N/A'}</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Sr.NO.</th>
              <th>Lot No.</th>
              <th>Description</th>
              <th>Hammer Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.lots.map((lot, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${lot.lotNumber}</td>
                <td>${lot.description}</td>
                <td>₹${lot.hammerPrice.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="totals">
              <td colspan="3">Total Hammer Price</td>
              <td>₹${invoice.amounts.totalHammerPrice.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        ${invoice.bankDetails?.accountNumber ? `
        <table class="vendor-info">
          <tr>
            <td colspan="2"><strong>Payment Details:</strong></td>
          </tr>
          <tr>
            <td><strong>Account Holder:</strong> ${invoice.bankDetails.accountHolderName || 'N/A'}</td>
            <td><strong>Bank:</strong> ${invoice.bankDetails.bankName || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Account No:</strong> ${invoice.bankDetails.accountNumber || 'N/A'}</td>
            <td><strong>IFSC:</strong> ${invoice.bankDetails.ifscCode || 'N/A'}</td>
          </tr>
        </table>
        ` : ''}

        <div class="signature-section">
          <div class="sign-box">
            <div>Vendor's Sign :</div>
            <div>Date :</div>
          </div>
          <div class="sign-box">
            <div>For, Chronicle Vaults - A Brand of Urhistory</div>
            <div class="sign-line">Auth. Signatory</div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    console.error('Post-sale PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating post-sale PDF'
    });
  }
});

// All routes are protected and require admin role
// Temporarily disabled for testing
// router.use(protect);
// router.use(admin);

// Generate vendor invoices for an auction
router.post('/generate', generateVendorInvoices);

// Update company details in all invoices
router.post('/update-company-details', updateCompanyDetailsInAllInvoices);

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
