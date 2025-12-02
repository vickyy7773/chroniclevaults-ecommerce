import AuctionInvoice from '../models/AuctionInvoice.js';
import Auction from '../models/Auction.js';
import User from '../models/User.js';
import { logActivity } from '../middleware/activityLogger.js';

// Indian state codes mapping
const STATE_CODES = {
  'Andhra Pradesh': '37',
  'Arunachal Pradesh': '12',
  'Assam': '18',
  'Bihar': '10',
  'Chhattisgarh': '22',
  'Goa': '30',
  'Gujarat': '24',
  'Haryana': '06',
  'Himachal Pradesh': '02',
  'Jharkhand': '20',
  'Karnataka': '29',
  'Kerala': '32',
  'Madhya Pradesh': '23',
  'Maharashtra': '27',
  'Manipur': '14',
  'Meghalaya': '17',
  'Mizoram': '15',
  'Nagaland': '13',
  'Odisha': '21',
  'Punjab': '03',
  'Rajasthan': '08',
  'Sikkim': '11',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Tripura': '16',
  'Uttar Pradesh': '09',
  'Uttarakhand': '05',
  'West Bengal': '19',
  'Delhi': '07',
  'Jammu and Kashmir': '01',
  'Ladakh': '38',
  'Puducherry': '34',
  'Chandigarh': '04',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Lakshadweep': '31',
  'Andaman and Nicobar Islands': '35'
};

// @desc    Create new auction invoice
// @route   POST /api/auction-invoices
// @access  Private/Admin
export const createAuctionInvoice = async (req, res) => {
  try {
    const {
      auctionId,
      lotNumber,
      buyerId,
      packingForwardingCharges,
      insuranceCharges,
      companyDetails
    } = req.body;

    // Get auction and lot details
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Find the specific lot
    const lot = auction.lots.find(l => l.lotNumber === lotNumber);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lot not found'
      });
    }

    // Check if lot is sold
    if (lot.status !== 'Sold') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create invoice for unsold lot'
      });
    }

    // Get buyer details
    const buyer = await User.findById(buyerId || lot.winner);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // Determine billing address state code
    const buyerState = buyer.address?.state || 'Maharashtra';
    const buyerStateCode = STATE_CODES[buyerState] || '27';

    // Company details (default for Chronicle Vaults)
    const defaultCompanyDetails = {
      name: companyDetails?.name || 'Chronicle Vaults',
      gstin: companyDetails?.gstin || '27XXXXX0000X1ZX',
      pan: companyDetails?.pan || 'XXXXX0000X',
      msme: companyDetails?.msme || 'MH-XX-XXXXXXX',
      address: companyDetails?.address || 'Mumbai',
      city: companyDetails?.city || 'Mumbai',
      state: companyDetails?.state || 'Maharashtra',
      stateCode: companyDetails?.stateCode || '27',
      phone: companyDetails?.phone || '+91-XXXXXXXXXX',
      email: companyDetails?.email || 'info@chroniclevaults.com',
      bankDetails: companyDetails?.bankDetails || {
        bankName: 'Bank Name',
        accountNumber: 'XXXXXXXXXXXX',
        ifsc: 'XXXXXX',
        branch: 'Mumbai'
      }
    };

    // Determine GST type (IGST for interstate, CGST+SGST for intrastate)
    const isInterstate = buyerStateCode !== defaultCompanyDetails.stateCode;
    const gstType = isInterstate ? 'IGST' : 'CGST+SGST';

    // Create invoice
    const invoice = await AuctionInvoice.create({
      auction: auctionId,
      lotNumber,
      buyer: buyer._id,
      buyerDetails: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        gstin: buyer.gstin || '',
        pan: buyer.pan || '',
        buyerNumber: `BUY${buyer._id.toString().slice(-3).toUpperCase()}`
      },
      billingAddress: {
        street: buyer.address?.street || '',
        city: buyer.address?.city || '',
        state: buyerState,
        stateCode: buyerStateCode,
        zipCode: buyer.address?.zipCode || ''
      },
      shippingAddress: {
        street: buyer.address?.street || '',
        city: buyer.address?.city || '',
        state: buyerState,
        stateCode: buyerStateCode,
        zipCode: buyer.address?.zipCode || ''
      },
      lotDetails: {
        description: lot.title,
        detailedDescription: lot.description,
        hsnCode: '97050090',
        quantity: 1,
        hammerPrice: lot.currentBid
      },
      packingForwardingCharges: {
        amount: packingForwardingCharges?.amount || 80,
        hsnCode: '99854'
      },
      insuranceCharges: {
        amount: insuranceCharges?.amount || 0,
        hsnCode: '99681',
        declined: insuranceCharges?.declined || true
      },
      gst: {
        type: gstType,
        rate: 5.00,
        itemGSTRate: 5.00,
        packingGSTRate: 18.00
      },
      shipping: {
        transportMode: 'Post/Courier',
        placeOfSupply: buyerState
      },
      companyDetails: defaultCompanyDetails,
      status: 'Generated'
    });

    // Log activity
    await logActivity(
      req,
      'create',
      'auction-invoices',
      `Created invoice ${invoice.invoiceNumber} for auction lot #${lotNumber}`,
      invoice._id,
      `Invoice ${invoice.invoiceNumber}`
    );

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Create auction invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all auction invoices
// @route   GET /api/auction-invoices
// @access  Private/Admin
export const getAllAuctionInvoices = async (req, res) => {
  try {
    const invoices = await AuctionInvoice.find({})
      .populate('buyer', 'name email phone')
      .populate('auction', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get auction invoice by ID
// @route   GET /api/auction-invoices/:id
// @access  Private/Admin
export const getAuctionInvoiceById = async (req, res) => {
  try {
    const invoice = await AuctionInvoice.findById(req.params.id)
      .populate('buyer', 'name email phone address gstin pan')
      .populate('auction', 'title lots');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update auction invoice
// @route   PUT /api/auction-invoices/:id
// @access  Private/Admin
export const updateAuctionInvoice = async (req, res) => {
  try {
    const invoice = await AuctionInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'buyerDetails',
      'billingAddress',
      'shippingAddress',
      'lotDetails',
      'packingForwardingCharges',
      'insuranceCharges',
      'gst',
      'shipping',
      'companyDetails',
      'notes',
      'termsAndConditions',
      'status'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        invoice[field] = req.body[field];
      }
    });

    await invoice.save();

    // Log activity
    await logActivity(
      req,
      'update',
      'auction-invoices',
      `Updated invoice ${invoice.invoiceNumber}`,
      invoice._id,
      `Invoice ${invoice.invoiceNumber}`
    );

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete auction invoice
// @route   DELETE /api/auction-invoices/:id
// @access  Private/Admin
export const deleteAuctionInvoice = async (req, res) => {
  try {
    const invoice = await AuctionInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const invoiceNumber = invoice.invoiceNumber;
    await invoice.deleteOne();

    // Log activity
    await logActivity(
      req,
      'delete',
      'auction-invoices',
      `Deleted invoice ${invoiceNumber}`,
      req.params.id,
      `Invoice ${invoiceNumber}`
    );

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get invoices for specific auction
// @route   GET /api/auction-invoices/auction/:auctionId
// @access  Private/Admin
export const getInvoicesByAuction = async (req, res) => {
  try {
    const invoices = await AuctionInvoice.find({ auction: req.params.auctionId })
      .populate('buyer', 'name email phone')
      .sort({ lotNumber: 1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark invoice as paid
// @route   PUT /api/auction-invoices/:id/pay
// @access  Private/Admin
export const markInvoiceAsPaid = async (req, res) => {
  try {
    const invoice = await AuctionInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    invoice.isPaid = true;
    invoice.paidAt = Date.now();
    invoice.paymentMode = req.body.paymentMode || 'Bank Transfer';
    invoice.status = 'Paid';

    await invoice.save();

    // Log activity
    await logActivity(
      req,
      'update',
      'auction-invoices',
      `Marked invoice ${invoice.invoiceNumber} as paid`,
      invoice._id,
      `Invoice ${invoice.invoiceNumber}`
    );

    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
