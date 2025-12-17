import {
  transferLotsBetweenBuyers,
  assignUnsoldLotsToBuyer,
  getUnsoldLots,
  getBuyersWithLots,
  getAllRegisteredBuyers
} from '../utils/invoiceHelpers.js';
import { logActivity } from '../middleware/activityLogger.js';

/**
 * @desc    Transfer specific lots from one buyer to another
 * @route   POST /api/lot-transfer/transfer
 * @access  Private/Admin
 */
export const transferLots = async (req, res) => {
  try {
    const { auctionId, fromBuyerId, toBuyerId, lotNumbers } = req.body;

    // Validation
    if (!auctionId || !fromBuyerId || !toBuyerId || !lotNumbers) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, fromBuyerId, toBuyerId, lotNumbers'
      });
    }

    if (!Array.isArray(lotNumbers) || lotNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'lotNumbers must be a non-empty array'
      });
    }

    // Execute transfer
    const result = await transferLotsBetweenBuyers(
      auctionId,
      fromBuyerId,
      toBuyerId,
      lotNumbers
    );

    // Log activity
    await logActivity(
      req,
      'transfer',
      'lot-transfer',
      `Transferred ${result.transferredLots} lots from buyer ${fromBuyerId} to ${toBuyerId}`,
      auctionId,
      `Auction ${auctionId}`
    );

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${result.transferredLots} lots`,
      data: {
        sourceInvoice: {
          id: result.sourceInvoice._id,
          invoiceNumber: result.sourceInvoice.invoiceNumber,
          remainingLots: result.sourceInvoice.lots.length,
          totalAmount: result.sourceInvoice.amounts.totalPayable
        },
        targetInvoice: {
          id: result.targetInvoice._id,
          invoiceNumber: result.targetInvoice.invoiceNumber,
          totalLots: result.targetInvoice.lots.length,
          totalAmount: result.targetInvoice.amounts.totalPayable
        },
        transferredLots: result.transferredLots
      }
    });
  } catch (error) {
    console.error('❌ Lot transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to transfer lots'
    });
  }
};

/**
 * @desc    Manually assign unsold lots to a buyer
 * @route   POST /api/lot-transfer/assign-unsold
 * @access  Private/Admin
 */
export const assignUnsoldLots = async (req, res) => {
  try {
    const { auctionId, buyerId, lotNumbers, hammerPrices } = req.body;

    // Validation
    if (!auctionId || !buyerId || !lotNumbers || !hammerPrices) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, buyerId, lotNumbers, hammerPrices'
      });
    }

    if (!Array.isArray(lotNumbers) || lotNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'lotNumbers must be a non-empty array'
      });
    }

    // Execute assignment
    const result = await assignUnsoldLotsToBuyer(
      auctionId,
      buyerId,
      lotNumbers,
      hammerPrices
    );

    // Log activity
    await logActivity(
      req,
      'assign',
      'lot-transfer',
      `Manually assigned ${result.assignedLots} unsold lots to buyer ${buyerId}`,
      auctionId,
      `Auction ${auctionId}`
    );

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${result.assignedLots} lots`,
      data: {
        invoice: {
          id: result.invoice._id,
          invoiceNumber: result.invoice.invoiceNumber,
          totalLots: result.invoice.lots.length,
          totalAmount: result.invoice.amounts.totalPayable
        },
        assignedLots: result.assignedLots
      }
    });
  } catch (error) {
    console.error('❌ Assign unsold lots error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign unsold lots'
    });
  }
};

/**
 * @desc    Get all unsold lots for an auction
 * @route   GET /api/lot-transfer/unsold/:auctionId
 * @access  Private/Admin
 */
export const getAuctionUnsoldLots = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const unsoldLots = await getUnsoldLots(auctionId);

    res.status(200).json({
      success: true,
      count: unsoldLots.length,
      data: unsoldLots
    });
  } catch (error) {
    console.error('❌ Get unsold lots error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch unsold lots'
    });
  }
};

/**
 * @desc    Get all buyers with their lots for an auction
 * @route   GET /api/lot-transfer/buyers/:auctionId
 * @access  Private/Admin
 */
export const getAuctionBuyersWithLots = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const buyers = await getBuyersWithLots(auctionId);

    res.status(200).json({
      success: true,
      count: buyers.length,
      data: buyers
    });
  } catch (error) {
    console.error('❌ Get buyers with lots error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch buyers with lots'
    });
  }
};

/**
 * @desc    Get all registered buyers from all auctions (for lot transfer)
 * @route   GET /api/lot-transfer/all-buyers
 * @access  Private/Admin
 */
export const getAllBuyers = async (req, res) => {
  try {
    const buyers = await getAllRegisteredBuyers();

    res.status(200).json({
      success: true,
      count: buyers.length,
      data: buyers
    });
  } catch (error) {
    console.error('❌ Get all buyers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch all buyers'
    });
  }
};
