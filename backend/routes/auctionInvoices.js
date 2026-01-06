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

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertHundreds = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
  };

  const convertThousands = (n) => {
    if (n < 1000) return convertHundreds(n);
    return convertHundreds(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertHundreds(n % 1000) : '');
  };

  const convertLakhs = (n) => {
    if (n < 100000) return convertThousands(n);
    return convertHundreds(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertThousands(n % 100000) : '');
  };

  return convertLakhs(Math.floor(num)) + ' Rupees Only';
};

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

    // Calculate commission (using globalCommission of 12% as default)
    const commissionRate = invoice.buyerDetails?.commissionPercentage || 12;
    const totalHammerPrice = (invoice.lots || [invoice.lotDetails]).reduce((sum, lot) => sum + (lot.hammerPrice || 0), 0);
    const totalCommission = (totalHammerPrice * commissionRate) / 100;

    // Calculate GST on commission (9% CGST + 9% SGST)
    const cgstOnCommission = (totalCommission * 9) / 100;
    const sgstOnCommission = (totalCommission * 9) / 100;

    // Calculate grand total
    const subtotalWithCommission = totalHammerPrice + totalCommission;
    const cgstOnHammer = (invoice.gst?.cgst || 0);
    const sgstOnHammer = (invoice.gst?.sgst || 0);
    const insuranceAmount = (invoice.insuranceCharges?.amount > 0 && !invoice.insuranceCharges?.declined) ? invoice.insuranceCharges.amount : 0;
    const grandTotal = Math.round(subtotalWithCommission + cgstOnHammer + sgstOnHammer + cgstOnCommission + sgstOnCommission + insuranceAmount);

    // Generate HTML content (same as admin template)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; line-height: 1.4; }
          .container { max-width: 210mm; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .company-info { flex: 1; }
          .company-name { font-size: 20px; font-weight: bold; color: #d35400; margin-bottom: 2px; }
          .tagline { font-size: 10px; color: #666; margin-bottom: 5px; }
          .contact-info { font-size: 9px; line-height: 1.6; }
          .invoice-title { text-align: center; font-size: 16px; font-weight: bold; margin: 15px 0; text-decoration: underline; }
          .two-col { display: flex; gap: 20px; margin-bottom: 15px; }
          .col-left { flex: 1; }
          .col-right { flex: 1; }
          .section-title { font-weight: bold; margin-bottom: 5px; font-size: 10px; }
          .info-row { margin-bottom: 3px; font-size: 10px; }
          .label { display: inline-block; width: 100px; font-weight: bold; }
          .table-container { margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #e8e8e8; font-weight: bold; text-align: center; }
          td { text-align: center; }
          td.desc { text-align: left; }
          .payment-section { display: flex; gap: 20px; margin-top: 15px; }
          .payment-detail { flex: 0 0 45%; border: 1px solid #000; padding: 10px; }
          .payment-calc { flex: 1; border: 1px solid #000; padding: 10px; }
          .calc-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; }
          .calc-row.total { font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
          .amount-words { margin: 15px 0; padding: 8px; border: 1px solid #000; font-size: 10px; }
          .remittance { margin: 10px 0; font-size: 9px; font-style: italic; }
          .bank-section { display: flex; gap: 10px; margin: 15px 0; }
          .bank-box { flex: 1; border: 1px solid #000; padding: 10px; font-size: 9px; }
          .bank-box h4 { font-size: 10px; margin-bottom: 5px; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
          .sign-box { text-align: center; }
          .sign-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; padding-top: 5px; font-size: 9px; }
          .footer { margin-top: 20px; border-top: 2px solid #333; padding-top: 10px; text-align: center; font-size: 9px; }
          @media print {
            body { padding: 0; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-info">
              <div class="company-name">CHRONICLE VAULTS</div>
              <div class="tagline">Buy, Sell, Auction • Vintage Coins | Stamps | Collectibles</div>
              <div class="contact-info">
                16/189, Netajinagar, Meghaninagar, Ahmedabad-380016, Gujarat, India<br>
                Tel: +91 84608 49878<br>
                Email: chroniclevaults@gmail.com<br>
                Web: chroniclevaults.com
              </div>
            </div>
          </div>

          <div class="invoice-title">Tax Invoice</div>

          <div class="two-col">
            <div class="col-left">
              <div class="section-title">Consignee:</div>
              <div class="info-row"><strong>${invoice.buyerDetails.name}</strong></div>
              <div class="info-row">${invoice.shippingAddress?.street || invoice.billingAddress?.street || ''}</div>
              <div class="info-row">${invoice.shippingAddress?.city || invoice.billingAddress?.city || ''}, ${invoice.shippingAddress?.state || invoice.billingAddress?.state || ''} - ${invoice.shippingAddress?.zipCode || invoice.billingAddress?.zipCode || ''}</div>
              <div class="info-row">Email: ${invoice.buyerDetails.email || ''}</div>
              <div class="info-row">Mobile: ${invoice.buyerDetails.phone || ''}</div>
              <div class="info-row">State Code: ${invoice.billingAddress?.stateCode || '24'}</div>
              <div class="info-row">GST NO: ${invoice.buyerDetails.gstin || 'N/A'}</div>
            </div>
            <div class="col-right">
              <div class="info-row"><span class="label">Auction No.:</span> ${invoice.auction?._id ? `AUC-${invoice.auction._id.toString().slice(-6).toUpperCase()}` : 'N/A'}</div>
              <div class="info-row"><span class="label">Auction Date:</span> ${invoice.auction?.startDate ? new Date(invoice.auction.startDate).toLocaleDateString() : 'N/A'}</div>
              <div class="info-row"><span class="label">Invoice No.:</span> ${invoice.invoiceNumber}</div>
              <div class="info-row"><span class="label">Invoice Date:</span> ${new Date(invoice.invoiceDate).toLocaleDateString()}</div>
              <div class="info-row"><span class="label">Bidder No.:</span> ${invoice.buyerDetails.buyerNumber || 'N/A'}</div>
              <div class="info-row"><span class="label">GST No:</span> ${invoice.buyerDetails.gstin || 'N/A'}</div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">Sr.</th>
                  <th style="width: 60px;">Lot#</th>
                  <th>Description</th>
                  <th style="width: 40px;">Qty</th>
                  <th style="width: 80px;">HSN Number</th>
                  <th style="width: 60px;">GST(%)</th>
                  <th style="width: 100px;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.lots || [invoice.lotDetails]).map((lot, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${lot.lotNumber || invoice.lotNumbers?.[idx] || invoice.lotNumber || 'N/A'}</td>
                    <td class="desc">${lot.description || lot.detailedDescription || ''}</td>
                    <td>${lot.quantity || 1}</td>
                    <td>9705</td>
                    <td>5.00</td>
                    <td>₹${(lot.hammerPrice || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="payment-section">
            <div class="payment-detail">
              <div class="section-title">Payment Detail</div>
              <div class="info-row"><span class="label">Payment Mode:</span> Cash / Cheque / Contra</div>
              <div class="info-row"><span class="label">Bank Name:</span> </div>
              <div class="info-row"><span class="label">Cheque No:</span> </div>
              <div class="info-row"><span class="label">Cheque Date:</span> </div>
              <div class="info-row"><span class="label">Amount in Rs:</span> </div>
            </div>
            <div class="payment-calc">
              <div class="calc-row">
                <span>Total Hammer Price:</span>
                <span>₹${totalHammerPrice.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)Commission (${commissionRate}%):</span>
                <span>₹${totalCommission.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)CGST On Hammer (2.5%) on (${totalHammerPrice}):</span>
                <span>₹${cgstOnHammer.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)SGST On Hammer (2.5%) on (${totalHammerPrice}):</span>
                <span>₹${sgstOnHammer.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+) Shipping:</span>
                <span>₹0</span>
              </div>
              ${insuranceAmount > 0 ? `
              <div class="calc-row">
                <span>(+) Insurance:</span>
                <span>₹${insuranceAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="calc-row">
                <span>(+)CGST on Service @ 9%:</span>
                <span>₹${cgstOnCommission.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>(+)SGST on Service @ 9%:</span>
                <span>₹${sgstOnCommission.toLocaleString()}</span>
              </div>
              <div class="calc-row">
                <span>Round Off:</span>
                <span>₹0</span>
              </div>
              <div class="calc-row total">
                <span>Total:</span>
                <span>₹${grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="amount-words">
            <strong>Amount in Words:</strong> ${numberToWords(grandTotal)}
          </div>

          <div class="remittance">
            Remittance in favor of M/s Chronicle Vaults, Ahmedabad by RTGS / NEFT / IMPS<br>
            GSTIN: 24AJHPM5349R1ZO | PAN: AJHPM5349R
          </div>

          <div class="bank-section">
            <div class="bank-box">
              <h4>Bank Details:</h4>
              Bank: Kotak Mahindra Bank<br>
              Account Name: Chronicle Vaults<br>
              Account No.: 6313874828<br>
              IFSC Code: KKBK0007629<br>
              Branch: Vejalpur
            </div>
            <div class="bank-box">
              <h4>Terms & Conditions:</h4>
              1. Payment to be made within 7 days<br>
              2. Interest @ 18% p.a. will be charged on delayed payments<br>
              3. All disputes subject to Ahmedabad jurisdiction
            </div>
          </div>

          <div class="signature-section">
            <div class="sign-box">
              <div class="sign-line">Customer's Signature</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">For Chronicle Vaults</div>
            </div>
          </div>

          <div class="footer">
            This is a computer-generated invoice and does not require a signature.
          </div>
        </div>
      </body>
      </html>
    `;

    // Return HTML for browser printing (same as admin)
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);

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
