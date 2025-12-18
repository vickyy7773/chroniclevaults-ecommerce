import Auction from '../models/Auction.js';
import VendorInvoice from '../models/VendorInvoice.js';
import Vendor from '../models/Vendor.js';
import { logActivity } from '../middleware/activityLogger.js';

/**
 * @desc    Get all vendors from a specific auction (for lot transfer)
 * @route   GET /api/vendor-lot-transfer/auction-vendors/:auctionId
 * @access  Private/Admin
 */
export const getAuctionVendors = async (req, res) => {
  try {
    const { auctionId } = req.params;

    // Find all vendor invoices for this auction
    const vendorInvoices = await VendorInvoice.find({ auction: auctionId })
      .populate('vendor', 'name email vendorCode mobile')
      .populate('auction', 'auctionCode title');

    // Group by vendor and include their lots
    const vendorMap = new Map();

    for (const invoice of vendorInvoices) {
      if (!invoice.vendor) continue;

      const vendorId = invoice.vendor._id.toString();

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendor: {
            _id: invoice.vendor._id,
            name: invoice.vendor.name,
            email: invoice.vendor.email,
            vendorCode: invoice.vendor.vendorCode,
            mobile: invoice.vendor.mobile
          },
          lots: []
        });
      }

      // Add lots from this invoice
      const vendorData = vendorMap.get(vendorId);
      vendorData.lots.push(...(invoice.lots || []));
    }

    // Convert map to array
    const vendors = Array.from(vendorMap.values());

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error('❌ Get auction vendors error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch auction vendors'
    });
  }
};

/**
 * @desc    Transfer specific lots from one vendor to another
 * @route   POST /api/vendor-lot-transfer/transfer
 * @access  Private/Admin
 */
export const transferLots = async (req, res) => {
  try {
    const { auctionId, fromVendorId, toVendorId, lotNumbers } = req.body;

    // Validation
    if (!auctionId || !fromVendorId || !toVendorId || !lotNumbers) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, fromVendorId, toVendorId, lotNumbers'
      });
    }

    if (fromVendorId === toVendorId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer lots to the same vendor'
      });
    }

    if (!Array.isArray(lotNumbers) || lotNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'lotNumbers must be a non-empty array'
      });
    }

    // 1. Get the auction and verify lots exist
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Verify all lots exist and belong to fromVendor
    for (const lotNum of lotNumbers) {
      const lot = auction.lots.find(l => l.lotNumber === lotNum);
      if (!lot) {
        return res.status(400).json({
          success: false,
          message: `Lot ${lotNum} not found in auction`
        });
      }
      if (lot.vendor?.toString() !== fromVendorId) {
        return res.status(400).json({
          success: false,
          message: `Lot ${lotNum} does not belong to the source vendor`
        });
      }
    }

    // 2. Find source invoice (from vendor's invoice)
    const sourceInvoice = await VendorInvoice.findOne({
      auction: auctionId,
      vendor: fromVendorId
    });

    if (!sourceInvoice) {
      return res.status(404).json({
        success: false,
        message: 'Source vendor invoice not found'
      });
    }

    // Verify all lots are in the source invoice
    for (const lotNum of lotNumbers) {
      const lotInInvoice = sourceInvoice.lots.find(l => l.lotNumber === lotNum);
      if (!lotInInvoice) {
        return res.status(400).json({
          success: false,
          message: `Lot ${lotNum} not found in source invoice`
        });
      }
    }

    // 3. Get lots data to transfer
    const lotsToTransfer = sourceInvoice.lots.filter(l => lotNumbers.includes(l.lotNumber));

    // 4. Remove lots from source invoice
    sourceInvoice.lots = sourceInvoice.lots.filter(l => !lotNumbers.includes(l.lotNumber));

    // If all lots transferred, delete the source invoice; otherwise save it
    if (sourceInvoice.lots.length === 0) {
      await sourceInvoice.deleteOne();
    } else {
      // Save source invoice (will auto-recalculate via pre-save hook)
      await sourceInvoice.save();
    }

    // 5. Update lot vendor in auction document
    for (const lotNum of lotNumbers) {
      const lot = auction.lots.find(l => l.lotNumber === lotNum);
      if (lot) {
        lot.vendor = toVendorId;
      }
    }
    await auction.save();

    // 6. Find or create target invoice (target vendor's invoice)
    let targetInvoice = await VendorInvoice.findOne({
      auction: auctionId,
      vendor: toVendorId
    });

    if (!targetInvoice) {
      // Create new invoice for target vendor
      const toVendor = await Vendor.findById(toVendorId);
      if (!toVendor) {
        return res.status(404).json({
          success: false,
          message: 'Target vendor not found'
        });
      }

      // Get a sample vendor invoice to copy company details
      const sampleInvoice = await VendorInvoice.findOne({ auction: auctionId });

      targetInvoice = new VendorInvoice({
        invoiceNumber: `VI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        invoiceDate: new Date(),
        auction: auctionId,
        vendor: toVendorId,
        vendorDetails: {
          vendorCode: toVendor.vendorCode,
          name: toVendor.name,
          email: toVendor.email,
          mobile: toVendor.mobile,
          commissionPercentage: toVendor.commissionPercentage || 10
        },
        companyDetails: sampleInvoice?.companyDetails || {
          name: 'Chronicle Vaults',
          email: 'info@chroniclevaults.com'
        },
        bankDetails: toVendor.bankDetails || null,
        lots: [],
        status: 'Generated'
      });
    }

    // 7. Add transferred lots to target invoice
    targetInvoice.lots.push(...lotsToTransfer);
    await targetInvoice.save();

    // Log activity
    await logActivity(
      req,
      'transfer',
      'vendor-lot-transfer',
      `Transferred ${lotNumbers.length} lots from vendor ${fromVendorId} to ${toVendorId}`,
      auctionId,
      `Auction ${auctionId}`
    );

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${lotNumbers.length} lots`,
      data: {
        sourceInvoice: sourceInvoice.lots.length > 0 ? {
          id: sourceInvoice._id,
          invoiceNumber: sourceInvoice.invoiceNumber,
          remainingLots: sourceInvoice.lots.length,
          totalAmount: sourceInvoice.amounts?.finalPayable
        } : null,
        targetInvoice: {
          id: targetInvoice._id,
          invoiceNumber: targetInvoice.invoiceNumber,
          totalLots: targetInvoice.lots.length,
          totalAmount: targetInvoice.amounts?.finalPayable
        },
        transferredLots: lotNumbers.length
      }
    });
  } catch (error) {
    console.error('❌ Vendor lot transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to transfer lots'
    });
  }
};
