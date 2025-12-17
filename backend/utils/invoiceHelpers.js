import AuctionInvoice from '../models/AuctionInvoice.js';
import Auction from '../models/Auction.js';
import User from '../models/User.js';
import AuctionRegistration from '../models/AuctionRegistration.js';

/**
 * Recalculate invoice totals based on current lots
 * Uses existing pre-save hook logic
 */
export const recalculateInvoice = async (invoiceId) => {
  const invoice = await AuctionInvoice.findById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  // Simply save - pre-save hook will recalculate everything
  await invoice.save();
  return invoice;
};

/**
 * Transfer specific lots from one buyer's invoice to another buyer's invoice
 * @param {String} auctionId - Auction ID
 * @param {String} fromBuyerId - Current owner (User A)
 * @param {String} toBuyerId - New owner (User B)
 * @param {Array<Number>} lotNumbers - Lot numbers to transfer [1, 4, 7]
 */
export const transferLotsBetweenBuyers = async (auctionId, fromBuyerId, toBuyerId, lotNumbers) => {
  if (fromBuyerId === toBuyerId) {
    throw new Error('Cannot transfer lots to the same buyer');
  }

  if (!lotNumbers || lotNumbers.length === 0) {
    throw new Error('No lots selected for transfer');
  }

  // 1. Get the auction and verify lots exist and are sold
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error('Auction not found');

  // Verify all lots exist and belong to fromBuyer
  for (const lotNum of lotNumbers) {
    const lot = auction.lots.find(l => l.lotNumber === lotNum);
    if (!lot) {
      throw new Error(`Lot ${lotNum} not found in auction`);
    }
    if (lot.status !== 'Sold') {
      throw new Error(`Lot ${lotNum} is not sold`);
    }
    if (lot.winner.toString() !== fromBuyerId) {
      throw new Error(`Lot ${lotNum} does not belong to the source buyer`);
    }
  }

  // 2. Find source invoice (User A's invoice)
  const sourceInvoice = await AuctionInvoice.findOne({
    auction: auctionId,
    buyer: fromBuyerId
  });

  if (!sourceInvoice) {
    throw new Error('Source buyer invoice not found');
  }

  // Verify all lots are in the source invoice
  for (const lotNum of lotNumbers) {
    const lotInInvoice = sourceInvoice.lots.find(l => l.lotNumber === lotNum);
    if (!lotInInvoice) {
      throw new Error(`Lot ${lotNum} not found in source invoice`);
    }
  }

  // Cannot transfer ALL lots - at least one must remain
  if (lotNumbers.length === sourceInvoice.lots.length) {
    throw new Error('Cannot transfer all lots. At least one lot must remain with the original buyer.');
  }

  // 3. Get lots data to transfer
  const lotsToTransfer = sourceInvoice.lots.filter(l => lotNumbers.includes(l.lotNumber));

  // 4. Remove lots from source invoice
  sourceInvoice.lots = sourceInvoice.lots.filter(l => !lotNumbers.includes(l.lotNumber));
  sourceInvoice.lotNumbers = sourceInvoice.lots.map(l => l.lotNumber);

  // Save source invoice (will auto-recalculate via pre-save hook)
  await sourceInvoice.save();

  // 5. Update lot winners in auction document
  for (const lotNum of lotNumbers) {
    const lot = auction.lots.find(l => l.lotNumber === lotNum);
    if (lot) {
      lot.winner = toBuyerId;
    }
  }
  await auction.save();

  // 6. Find or create target invoice (User B's invoice)
  let targetInvoice = await AuctionInvoice.findOne({
    auction: auctionId,
    buyer: toBuyerId
  });

  if (!targetInvoice) {
    // Create new invoice for User B using same logic as original invoice creation
    const toBuyer = await User.findById(toBuyerId);
    if (!toBuyer) throw new Error('Target buyer not found');

    // Get buyer's auction registration for address details
    const auctionReg = await AuctionRegistration.findOne({
      userId: toBuyerId,
      status: 'approved'
    });

    let billingStreet = '';
    let billingCity = '';
    let billingState = 'Maharashtra';
    let billingZipCode = '';
    let buyerGstin = '';
    let buyerPan = '';
    let buyerPhone = '';

    if (auctionReg) {
      const addressParts = [
        auctionReg.billingAddress.addressLine1,
        auctionReg.billingAddress.addressLine2,
        auctionReg.billingAddress.addressLine3
      ].filter(Boolean);

      billingStreet = addressParts.join(', ');
      billingCity = auctionReg.billingAddress.city;
      billingState = auctionReg.billingAddress.state;
      billingZipCode = auctionReg.billingAddress.pinCode;
      buyerGstin = auctionReg.gstNumber || '';
      buyerPhone = auctionReg.mobile || toBuyer.phone || '';
      buyerPan = auctionReg.panNumber || (auctionReg.gstNumber ? auctionReg.gstNumber.substring(2, 12) : '');
    } else if (toBuyer.address) {
      billingStreet = toBuyer.address.street || '';
      billingCity = toBuyer.address.city || '';
      billingState = toBuyer.address.state || 'Maharashtra';
      billingZipCode = toBuyer.address.zipCode || '';
      buyerGstin = toBuyer.gstin || '';
      buyerPan = toBuyer.pan || '';
    }

    // State code mapping
    const STATE_CODES = {
      'Maharashtra': '27',
      'Delhi': '07',
      'Karnataka': '29',
      'Tamil Nadu': '33',
      'Gujarat': '24',
      'Rajasthan': '08',
      'West Bengal': '19',
      'Uttar Pradesh': '09'
    };

    const buyerStateCode = STATE_CODES[billingState] || '27';
    const companyStateCode = '27'; // Maharashtra
    const isInterstate = buyerStateCode !== companyStateCode;
    const gstType = isInterstate ? 'IGST' : 'CGST+SGST';

    targetInvoice = new AuctionInvoice({
      auction: auctionId,
      buyer: toBuyerId,
      buyerDetails: {
        name: toBuyer.name,
        email: toBuyer.email,
        phone: buyerPhone,
        gstin: buyerGstin,
        pan: buyerPan,
        buyerNumber: `BUY${toBuyerId.toString().slice(-3).toUpperCase()}`
      },
      billingAddress: {
        street: billingStreet,
        city: billingCity,
        state: billingState,
        stateCode: buyerStateCode,
        zipCode: billingZipCode
      },
      shippingAddress: {
        street: billingStreet,
        city: billingCity,
        state: billingState,
        stateCode: buyerStateCode,
        zipCode: billingZipCode
      },
      lots: [],
      lotNumbers: [],
      packingForwardingCharges: { amount: 80, hsnCode: '99854' },
      insuranceCharges: { amount: 0, hsnCode: '99681', declined: true },
      gst: {
        type: gstType,
        rate: 5.00,
        itemGSTRate: 5.00,
        packingGSTRate: 18.00
      },
      shipping: {
        transportMode: 'Post/Courier',
        placeOfSupply: billingState
      },
      companyDetails: sourceInvoice.companyDetails, // Use same company details
      status: 'Generated'
    });
  }

  // 7. Add transferred lots to target invoice
  targetInvoice.lots.push(...lotsToTransfer);
  targetInvoice.lotNumbers = targetInvoice.lots.map(l => l.lotNumber);

  // Save target invoice (will auto-recalculate via pre-save hook)
  await targetInvoice.save();

  return {
    sourceInvoice,
    targetInvoice,
    transferredLots: lotsToTransfer.length
  };
};

/**
 * Manually assign unsold lots to a buyer
 * @param {String} auctionId - Auction ID
 * @param {String} buyerId - Buyer to assign lots to
 * @param {Array<Number>} lotNumbers - Unsold lot numbers to assign
 * @param {Number} hammerPrice - Manual sale price for each lot (or object with prices per lot)
 */
export const assignUnsoldLotsToBuyer = async (auctionId, buyerId, lotNumbers, hammerPrices) => {
  if (!lotNumbers || lotNumbers.length === 0) {
    throw new Error('No lots selected for assignment');
  }

  // 1. Get the auction
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error('Auction not found');

  // 2. Verify all lots are unsold
  const lotsToAssign = [];
  for (const lotNum of lotNumbers) {
    const lot = auction.lots.find(l => l.lotNumber === lotNum);
    if (!lot) {
      throw new Error(`Lot ${lotNum} not found in auction`);
    }
    if (lot.status === 'Sold') {
      throw new Error(`Lot ${lotNum} is already sold`);
    }
    if (lot.status !== 'Unsold') {
      throw new Error(`Lot ${lotNum} status is ${lot.status}, can only assign Unsold lots`);
    }
    lotsToAssign.push(lot);
  }

  // 3. Update lot status to Sold and set winner
  for (const lot of lotsToAssign) {
    lot.status = 'Sold';
    lot.winner = buyerId;

    // Set hammer price (manual sale price)
    const price = typeof hammerPrices === 'object'
      ? hammerPrices[lot.lotNumber]
      : hammerPrices;

    if (!price || price <= 0) {
      throw new Error(`Invalid hammer price for lot ${lot.lotNumber}`);
    }

    lot.currentBid = price;
  }

  await auction.save();

  // 4. Find or create buyer's invoice
  let invoice = await AuctionInvoice.findOne({
    auction: auctionId,
    buyer: buyerId
  });

  const buyer = await User.findById(buyerId);
  if (!buyer) throw new Error('Buyer not found');

  if (!invoice) {
    // Create new invoice (same logic as transfer function)
    const auctionReg = await AuctionRegistration.findOne({
      userId: buyerId,
      status: 'approved'
    });

    let billingStreet = '';
    let billingCity = '';
    let billingState = 'Maharashtra';
    let billingZipCode = '';
    let buyerGstin = '';
    let buyerPan = '';
    let buyerPhone = '';

    if (auctionReg) {
      const addressParts = [
        auctionReg.billingAddress.addressLine1,
        auctionReg.billingAddress.addressLine2,
        auctionReg.billingAddress.addressLine3
      ].filter(Boolean);

      billingStreet = addressParts.join(', ');
      billingCity = auctionReg.billingAddress.city;
      billingState = auctionReg.billingAddress.state;
      billingZipCode = auctionReg.billingAddress.pinCode;
      buyerGstin = auctionReg.gstNumber || '';
      buyerPhone = auctionReg.mobile || buyer.phone || '';
      buyerPan = auctionReg.panNumber || (auctionReg.gstNumber ? auctionReg.gstNumber.substring(2, 12) : '');
    } else if (buyer.address) {
      billingStreet = buyer.address.street || '';
      billingCity = buyer.address.city || '';
      billingState = buyer.address.state || 'Maharashtra';
      billingZipCode = buyer.address.zipCode || '';
      buyerGstin = buyer.gstin || '';
      buyerPan = buyer.pan || '';
    }

    const STATE_CODES = {
      'Maharashtra': '27',
      'Delhi': '07',
      'Karnataka': '29',
      'Tamil Nadu': '33',
      'Gujarat': '24',
      'Rajasthan': '08',
      'West Bengal': '19',
      'Uttar Pradesh': '09'
    };

    const buyerStateCode = STATE_CODES[billingState] || '27';
    const isInterstate = buyerStateCode !== '27';
    const gstType = isInterstate ? 'IGST' : 'CGST+SGST';

    invoice = new AuctionInvoice({
      auction: auctionId,
      buyer: buyerId,
      buyerDetails: {
        name: buyer.name,
        email: buyer.email,
        phone: buyerPhone,
        gstin: buyerGstin,
        pan: buyerPan,
        buyerNumber: `BUY${buyerId.toString().slice(-3).toUpperCase()}`
      },
      billingAddress: {
        street: billingStreet,
        city: billingCity,
        state: billingState,
        stateCode: buyerStateCode,
        zipCode: billingZipCode
      },
      shippingAddress: {
        street: billingStreet,
        city: billingCity,
        state: billingState,
        stateCode: buyerStateCode,
        zipCode: billingZipCode
      },
      lots: [],
      lotNumbers: [],
      packingForwardingCharges: { amount: 80, hsnCode: '99854' },
      insuranceCharges: { amount: 0, hsnCode: '99681', declined: true },
      gst: {
        type: gstType,
        rate: 5.00,
        itemGSTRate: 5.00,
        packingGSTRate: 18.00
      },
      shipping: {
        transportMode: 'Post/Courier',
        placeOfSupply: billingState
      },
      companyDetails: {
        name: 'Chronicle Vaults',
        gstin: '27XXXXX0000X1ZX',
        pan: 'XXXXX0000X',
        msme: 'MH-XX-XXXXXXX',
        address: 'Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        phone: '+91-XXXXXXXXXX',
        email: 'info@chroniclevaults.com',
        bankDetails: {
          bankName: 'Saraswat Bank',
          accountNumber: '610000000016716',
          accountName: 'urhistory',
          ifsc: 'SRCB000362',
          branch: 'CG Road'
        }
      },
      status: 'Generated'
    });
  }

  // 5. Add lots to invoice
  for (const lot of lotsToAssign) {
    const price = typeof hammerPrices === 'object'
      ? hammerPrices[lot.lotNumber]
      : hammerPrices;

    invoice.lots.push({
      lotNumber: lot.lotNumber,
      description: lot.title,
      detailedDescription: lot.description,
      hsnCode: '97050090',
      quantity: 1,
      hammerPrice: price
    });
  }

  invoice.lotNumbers = invoice.lots.map(l => l.lotNumber);

  // Save invoice (will auto-recalculate)
  await invoice.save();

  return {
    invoice,
    assignedLots: lotsToAssign.length
  };
};

/**
 * Get all unsold lots for an auction
 */
export const getUnsoldLots = async (auctionId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new Error('Auction not found');

  return auction.lots.filter(lot => lot.status === 'Unsold');
};

/**
 * Get all buyers with their lots for an auction
 */
export const getBuyersWithLots = async (auctionId) => {
  const invoices = await AuctionInvoice.find({ auction: auctionId })
    .populate('buyer', 'name email phone')
    .sort({ createdAt: -1 });

  return invoices.map(invoice => ({
    buyer: invoice.buyer,
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    lots: invoice.lots,
    totalAmount: invoice.amounts.totalPayable
  }));
};

/**
 * Get all approved auction registrations (for lot transfer across all auctions)
 */
export const getAllRegisteredBuyers = async () => {
  // Get all approved auction registrations
  const registrations = await AuctionRegistration.find({
    status: 'approved',
    userId: { $exists: true, $ne: null } // Only those linked to users
  })
    .populate('userId', 'name email phone')
    .sort({ approvedAt: -1 });

  // For each registration, get their lots/invoices if any
  const buyersWithData = await Promise.all(
    registrations.map(async (reg) => {
      const invoices = await AuctionInvoice.find({ buyer: reg.userId._id })
        .select('lots amounts.totalPayable');

      // Aggregate all lots across all invoices
      const allLots = invoices.reduce((acc, inv) => acc.concat(inv.lots || []), []);

      return {
        buyer: reg.userId,
        auctionReg: {
          registrationId: reg.auctionId,
          auctionId: reg.auctionId,
          mobile: reg.mobile,
          email: reg.email,
          panNumber: reg.panNumber,
          gstNumber: reg.gstNumber
        },
        lots: allLots,
        totalInvoices: invoices.length
      };
    })
  );

  return buyersWithData;
};
