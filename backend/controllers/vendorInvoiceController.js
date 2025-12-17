import VendorInvoice from '../models/VendorInvoice.js';
import Vendor from '../models/Vendor.js';
import Auction from '../models/Auction.js';
import AuctionInvoice from '../models/AuctionInvoice.js';

/**
 * @desc    Get all vendor invoices with filters
 * @route   GET /api/vendor-invoices
 * @access  Private/Admin
 */
export const getAllVendorInvoices = async (req, res) => {
  try {
    const { auction, vendor, status } = req.query;

    const filter = {};
    if (auction) filter.auction = auction;
    if (vendor) filter.vendor = vendor;
    if (status) filter.status = status;

    const invoices = await VendorInvoice.find(filter)
      .populate('vendor', 'vendorCode name email mobile')
      .populate('auction', 'auctionCode title startTime')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('Get all vendor invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendor invoices',
      error: error.message
    });
  }
};

/**
 * @desc    Get single vendor invoice by ID
 * @route   GET /api/vendor-invoices/:id
 * @access  Private/Admin
 */
export const getVendorInvoiceById = async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id)
      .populate('vendor')
      .populate('auction')
      .populate('lots.customerInvoice');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Vendor invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get vendor invoice by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendor invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Generate/update vendor invoices for an auction
 * @route   POST /api/vendor-invoices/generate
 * @access  Private/Admin
 *
 * This generates vendor invoices based on ALL sold lots:
 * - Lots sold during the auction
 * - Unsold lots that were sold later (via customer invoices)
 */
export const generateVendorInvoices = async (req, res) => {
  try {
    const { auctionId } = req.body;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        message: 'Auction ID is required'
      });
    }

    // Get auction details
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Find all customer invoices for this auction
    const customerInvoices = await AuctionInvoice.find({ auction: auctionId })
      .populate('buyer', 'name email');

    // Create a map of lotNumber -> customerInvoice for quick lookup
    const lotToCustomerInvoiceMap = {};
    customerInvoices.forEach(invoice => {
      invoice.lots.forEach(lot => {
        lotToCustomerInvoiceMap[lot.lotNumber] = {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          buyer: invoice.buyer,
          hammerPrice: lot.hammerPrice
        };
      });
    });

    // Group sold lots by vendor
    const vendorLotsMap = {};

    // Process lots from auction
    if (auction.lots && auction.lots.length > 0) {
      auction.lots.forEach(lot => {
        // Skip unsold lots that haven't been sold later
        if (lot.status === 'Unsold' && !lotToCustomerInvoiceMap[lot.lotNumber]) {
          return;
        }

        // Skip lots without vendor ID
        if (!lot.vendorId) {
          return;
        }

        const vendorId = lot.vendorId;

        // Initialize vendor entry if not exists
        if (!vendorLotsMap[vendorId]) {
          vendorLotsMap[vendorId] = [];
        }

        // Determine hammer price and customer invoice
        let hammerPrice;
        let customerInvoiceId = null;
        let soldDuringAuction = true;

        if (lot.status === 'Sold') {
          // Sold during auction
          hammerPrice = lot.currentBid || lot.startingPrice;
          soldDuringAuction = true;

          // Check if there's a customer invoice for this lot
          if (lotToCustomerInvoiceMap[lot.lotNumber]) {
            customerInvoiceId = lotToCustomerInvoiceMap[lot.lotNumber].invoiceId;
            hammerPrice = lotToCustomerInvoiceMap[lot.lotNumber].hammerPrice; // Use invoice hammer price
          }
        } else if (lot.status === 'Unsold' && lotToCustomerInvoiceMap[lot.lotNumber]) {
          // Unsold lot that was sold later
          hammerPrice = lotToCustomerInvoiceMap[lot.lotNumber].hammerPrice;
          customerInvoiceId = lotToCustomerInvoiceMap[lot.lotNumber].invoiceId;
          soldDuringAuction = false;
        } else {
          // Skip lots that are not sold
          return;
        }

        vendorLotsMap[vendorId].push({
          lotNumber: lot.lotNumber,
          description: lot.title || lot.description || `Lot ${lot.lotNumber}`,
          hammerPrice,
          customerInvoice: customerInvoiceId,
          soldDuringAuction
        });
      });
    }

    // Generate/update invoices for each vendor
    const generatedInvoices = [];

    for (const [vendorId, lots] of Object.entries(vendorLotsMap)) {
      // Get vendor details by vendorCode (not ObjectId)
      // Handle both "VEN001" and "VEN0001" formats
      let vendor = await Vendor.findOne({ vendorCode: vendorId });

      // If not found, try padding with zeros (VEN001 -> VEN0001)
      if (!vendor && vendorId.match(/^VEN\d{1,3}$/)) {
        const paddedCode = vendorId.replace(/(\d+)$/, (match) => match.padStart(4, '0'));
        vendor = await Vendor.findOne({ vendorCode: paddedCode });
      }

      if (!vendor) {
        console.warn(`⚠️ Vendor with code ${vendorId} not found, skipping`);
        continue;
      }

      // Check if invoice already exists for this vendor-auction combination
      let vendorInvoice = await VendorInvoice.findOne({
        auction: auctionId,
        vendor: vendor._id
      });

      const lotData = lots.map(lot => ({
        lotNumber: lot.lotNumber,
        description: lot.description,
        hammerPrice: lot.hammerPrice,
        commissionRate: vendor.commissionPercentage,
        commissionAmount: 0, // Will be calculated by pre-save hook
        netPayable: 0, // Will be calculated by pre-save hook
        soldDuringAuction: lot.soldDuringAuction,
        soldDate: new Date(),
        customerInvoice: lot.customerInvoice
      }));

      if (vendorInvoice) {
        // Update existing invoice
        vendorInvoice.lots = lotData;
        vendorInvoice.vendorDetails = {
          vendorCode: vendor.vendorCode,
          name: vendor.name,
          email: vendor.email,
          mobile: vendor.mobile,
          address: vendor.address,
          commissionPercentage: vendor.commissionPercentage
        };
        vendorInvoice.bankDetails = vendor.bankDetails;
        vendorInvoice.status = 'Generated';

        await vendorInvoice.save();
        generatedInvoices.push(vendorInvoice);
      } else {
        // Create new invoice
        vendorInvoice = await VendorInvoice.create({
          auction: auctionId,
          vendor: vendor._id,
          vendorDetails: {
            vendorCode: vendor.vendorCode,
            name: vendor.name,
            email: vendor.email,
            mobile: vendor.mobile,
            address: vendor.address,
            commissionPercentage: vendor.commissionPercentage
          },
          bankDetails: vendor.bankDetails,
          lots: lotData,
          status: 'Generated',
          companyDetails: {
            name: 'Chronicle Vaults',
            gstin: '24BCZPD7594Q1ZE',
            pan: 'BCZPD7594Q',
            address: '16/189, Netajinagar, Meghaninagar',
            city: 'Ahmedabad',
            state: 'Gujarat',
            phone: '+91-9825085348',
            email: 'info@chroniclevaults.com'
          }
        });

        generatedInvoices.push(vendorInvoice);
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedInvoices.length} vendor invoice(s)`,
      count: generatedInvoices.length,
      data: generatedInvoices
    });
  } catch (error) {
    console.error('❌ Generate vendor invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating vendor invoices',
      error: error.message
    });
  }
};

/**
 * @desc    Update vendor invoice
 * @route   PUT /api/vendor-invoices/:id
 * @access  Private/Admin
 */
export const updateVendorInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const invoice = await VendorInvoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Vendor invoice not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['vendorDetails', 'bankDetails', 'lots', 'notes', 'termsAndConditions', 'status'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        invoice[field] = updates[field];
      }
    });

    await invoice.save(); // Pre-save hook will recalculate commission amounts

    res.status(200).json({
      success: true,
      message: 'Vendor invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Update vendor invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating vendor invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Mark vendor invoice as paid
 * @route   PUT /api/vendor-invoices/:id/payment
 * @access  Private/Admin
 */
export const markVendorInvoiceAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode, paymentReference } = req.body;

    const invoice = await VendorInvoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Vendor invoice not found'
      });
    }

    invoice.isPaid = true;
    invoice.paidAt = new Date();
    invoice.status = 'Paid';

    if (paymentMode) invoice.paymentMode = paymentMode;
    if (paymentReference) invoice.paymentReference = paymentReference;

    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Vendor invoice marked as paid',
      data: invoice
    });
  } catch (error) {
    console.error('Mark vendor invoice as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking invoice as paid',
      error: error.message
    });
  }
};

/**
 * @desc    Delete vendor invoice
 * @route   DELETE /api/vendor-invoices/:id
 * @access  Private/Admin
 */
export const deleteVendorInvoice = async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Vendor invoice not found'
      });
    }

    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vendor invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete vendor invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting vendor invoice',
      error: error.message
    });
  }
};

/**
 * @desc    Get vendor invoices by auction
 * @route   GET /api/vendor-invoices/auction/:auctionId
 * @access  Private/Admin
 */
export const getVendorInvoicesByAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const invoices = await VendorInvoice.find({ auction: auctionId })
      .populate('vendor', 'vendorCode name email mobile commissionPercentage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('Get vendor invoices by auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching vendor invoices',
      error: error.message
    });
  }
};
