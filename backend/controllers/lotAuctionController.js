import LotAuction from '../models/LotAuction.js';
import Auction from '../models/Auction.js';
import AuctionInvoice from '../models/AuctionInvoice.js';
import User from '../models/User.js';
import AuctionRegistration from '../models/AuctionRegistration.js';
// Coin helpers (duplicated here to avoid circular import with auctionController)
const freezeCoinsForLot = async (userId, auctionId, lotNumber, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.auctionCoins < amount) throw new Error('Insufficient auction coins');

  const existing = user.frozenCoinsPerAuction.find(
    f => f.auctionId.toString() === auctionId.toString() && f.lotNumber === lotNumber
  );
  if (existing) {
    const diff = amount - existing.amount;
    user.auctionCoins -= diff;
    existing.amount = amount;
    user.frozenCoins += diff;
  } else {
    user.auctionCoins -= amount;
    user.frozenCoinsPerAuction.push({ auctionId, lotNumber, amount });
    user.frozenCoins += amount;
  }
  await user.save();
  return { success: true, user };
};

const unfreezeCoinsForLot = async (userId, auctionId, lotNumber) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const idx = user.frozenCoinsPerAuction.findIndex(
    f => f.auctionId.toString() === auctionId.toString() && f.lotNumber === lotNumber
  );
  if (idx !== -1) {
    const frozenAmount = user.frozenCoinsPerAuction[idx].amount;
    user.auctionCoins += frozenAmount;
    user.frozenCoinsPerAuction.splice(idx, 1);
    user.frozenCoins = Math.max(0, user.frozenCoins - frozenAmount);
    await user.save();
    return { success: true, unfrozenAmount: frozenAmount, user };
  }
  return { success: true, unfrozenAmount: 0, user };
};

// ─── Admin: Create a new lot auction ────────────────────────────────────────
export const createLotAuction = async (req, res) => {
  try {
    const {
      title,
      description,
      catalogPdf,
      externalPlatformName,
      externalPlatformLink,
      lotBiddingEndTime,
      posterDisplayUntil,
      status,
      image,
      shortCode,
    } = req.body;

    const auction = await LotAuction.create({
      title,
      description,
      catalogPdf,
      externalPlatformName,
      externalPlatformLink,
      lotBiddingEndTime,
      posterDisplayUntil: posterDisplayUntil || null,
      status,
      image,
      shortCode: shortCode || null,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: auction });
  } catch (error) {
    console.error('createLotAuction error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Get all lot auctions ─────────────────────────────────────────────
export const getAllLotAuctions = async (req, res) => {
  try {
    const auctions = await LotAuction.find()
      .sort({ createdAt: -1 })
      .select('-lots.bids');

    return res.json({ success: true, data: auctions });
  } catch (error) {
    console.error('getAllLotAuctions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Get single lot auction by id ─────────────────────────────────────
export const getLotAuctionById = async (req, res) => {
  try {
    const auction = await LotAuction.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lots.winner', 'name email phone')
      .populate('lots.bids.user', 'name email');

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    return res.json({ success: true, data: auction });
  } catch (error) {
    console.error('getLotAuctionById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Update auction details ───────────────────────────────────────────
export const updateLotAuction = async (req, res) => {
  try {
    const allowedFields = [
      'title',
      'description',
      'catalogPdf',
      'externalPlatformName',
      'externalPlatformLink',
      'lotBiddingEndTime',
      'posterDisplayUntil',
      'shortCode',
      'status',
      'image',
    ];

    const dateFields = new Set(['lotBiddingEndTime', 'posterDisplayUntil']);
    const update = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const val = req.body[field];
        if (field === 'shortCode') {
          update[field] = val || null;
        } else if (dateFields.has(field)) {
          update[field] = val || null;
        } else {
          update[field] = val;
        }
      }
    });

    const auction = await LotAuction.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    return res.json({ success: true, data: auction });
  } catch (error) {
    console.error('updateLotAuction error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Delete auction ────────────────────────────────────────────────────
export const deleteLotAuction = async (req, res) => {
  try {
    const auction = await LotAuction.findByIdAndDelete(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }
    return res.json({ success: true, message: 'Lot auction deleted successfully' });
  } catch (error) {
    console.error('deleteLotAuction error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Add a lot to an auction ──────────────────────────────────────────
export const addLot = async (req, res) => {
  try {
    const auction = await LotAuction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    const {
      lotNumber,
      title,
      description,
      images,
      startingPrice,
      reservePrice,
      estimatedPrice,
      hsn,
      status,
    } = req.body;

    // Check for duplicate lot number
    const exists = auction.lots.some((l) => l.lotNumber === lotNumber);
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: `Lot number ${lotNumber} already exists in this auction` });
    }

    auction.lots.push({
      lotNumber,
      title,
      description,
      images: images || [],
      startingPrice,
      reservePrice,
      estimatedPrice,
      hsn,
      status: status || 'Upcoming',
    });

    await auction.save();
    return res.status(201).json({ success: true, data: auction });
  } catch (error) {
    console.error('addLot error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Update a lot ──────────────────────────────────────────────────────
export const updateLot = async (req, res) => {
  try {
    const auction = await LotAuction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    const lotNumber = Number(req.params.lotNumber);
    const lot = auction.lots.find((l) => l.lotNumber === lotNumber);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    const updatableFields = [
      'title',
      'description',
      'images',
      'startingPrice',
      'reservePrice',
      'estimatedPrice',
      'hsn',
      'status',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) lot[field] = req.body[field];
    });

    await auction.save();
    return res.json({ success: true, data: lot });
  } catch (error) {
    console.error('updateLot error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Delete a lot ──────────────────────────────────────────────────────
export const deleteLot = async (req, res) => {
  try {
    const auction = await LotAuction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    const lotNumber = Number(req.params.lotNumber);
    const before = auction.lots.length;
    auction.lots = auction.lots.filter((l) => l.lotNumber !== lotNumber);

    if (auction.lots.length === before) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    await auction.save();
    return res.json({ success: true, message: `Lot ${lotNumber} deleted` });
  } catch (error) {
    console.error('deleteLot error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Update auction status ────────────────────────────────────────────
export const updateAuctionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'LotBidding', 'Paused', 'ResultsPending', 'Completed', 'Cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const auction = await LotAuction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    return res.json({ success: true, data: auction });
  } catch (error) {
    console.error('updateAuctionStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Upload / bulk-apply results ──────────────────────────────────────
// Body: { results: [{ lotNumber, hammerPrice, winnerUserId?, winnerName, winnerPhone, winnerEmail, isExternalWinner }] }
export const uploadResults = async (req, res) => {
  try {
    const auction = await LotAuction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ success: false, message: 'results array is required' });
    }

    const processed = [];

    for (const entry of results) {
      const {
        lotNumber,
        hammerPrice,
        winnerUserId,
        winnerName,
        winnerPhone,
        winnerEmail,
        isExternalWinner,
      } = entry;

      const lot = auction.lots.find((l) => l.lotNumber === Number(lotNumber));
      if (!lot) {
        processed.push({ lotNumber, skipped: true, reason: 'Lot not found' });
        continue;
      }

      // Determine winner
      if (isExternalWinner) {
        lot.isExternalWinner = true;
        lot.winnerName = winnerName || null;
        lot.winnerPhone = winnerPhone || null;
        lot.winnerEmail = winnerEmail || null;
        lot.winner = null;
        lot.hammerPrice = hammerPrice;
        lot.status = hammerPrice ? 'Sold' : 'Unsold';
      } else if (winnerUserId) {
        lot.winner = winnerUserId;
        lot.isExternalWinner = false;
        lot.winnerName = winnerName || null;
        lot.winnerPhone = winnerPhone || null;
        lot.winnerEmail = winnerEmail || null;
        lot.hammerPrice = hammerPrice;
        lot.status = 'Sold';
      } else {
        // Try to resolve winner from reserve bids
        const reserveBids = lot.bids.filter((b) => b.isReserveBid);
        if (reserveBids.length > 0 && hammerPrice) {
          // Find highest reserve bidder whose maxBid >= hammerPrice
          const eligible = reserveBids
            .filter((b) => b.maxBid != null && b.maxBid >= hammerPrice)
            .sort((a, b) => b.maxBid - a.maxBid);

          if (eligible.length > 0) {
            lot.winner = eligible[0].user;
            lot.hammerPrice = hammerPrice;
            lot.status = 'Sold';
            lot.isExternalWinner = false;
          } else {
            // No eligible reserve bidder
            lot.hammerPrice = hammerPrice;
            lot.status = hammerPrice ? 'Sold' : 'Unsold';
          }
        } else {
          lot.hammerPrice = hammerPrice;
          lot.status = hammerPrice ? 'Sold' : 'Unsold';
        }
      }

      processed.push({ lotNumber, status: lot.status });
    }

    // After all lots processed, mark auction as Completed
    auction.status = 'Completed';
    await auction.save();

    return res.json({ success: true, data: { processed, auctionStatus: auction.status } });
  } catch (error) {
    console.error('uploadResults error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Generate invoices after results upload ───────────────────────────
// Groups sold lots by winner (userId), creates one AuctionInvoice per buyer
export const generateInvoices = async (req, res) => {
  try {
    const auction = await LotAuction.findById(req.params.id)
      .populate('lots.winner', 'name email phone address gstin pan');

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    if (auction.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Auction must be Completed before generating invoices' });
    }

    const { commissionPercentage = 12 } = req.body;

    const STATE_CODES = {
      'Andhra Pradesh': '37', 'Arunachal Pradesh': '12', 'Assam': '18', 'Bihar': '10',
      'Chhattisgarh': '22', 'Goa': '30', 'Gujarat': '24', 'Haryana': '06',
      'Himachal Pradesh': '02', 'Jharkhand': '20', 'Karnataka': '29', 'Kerala': '32',
      'Madhya Pradesh': '23', 'Maharashtra': '27', 'Manipur': '14', 'Meghalaya': '17',
      'Mizoram': '15', 'Nagaland': '13', 'Odisha': '21', 'Punjab': '03',
      'Rajasthan': '08', 'Sikkim': '11', 'Tamil Nadu': '33', 'Telangana': '36',
      'Tripura': '16', 'Uttar Pradesh': '09', 'Uttarakhand': '05', 'West Bengal': '19',
      'Delhi': '07', 'Jammu and Kashmir': '01', 'Ladakh': '38', 'Puducherry': '34',
      'Chandigarh': '04', 'Dadra and Nagar Haveli and Daman and Diu': '26'
    };
    const companyStateCode = '24'; // Gujarat

    // Group sold lots by winner userId
    const buyerMap = {}; // { userId: [lot, ...] }
    const skipped = [];

    for (const lot of auction.lots) {
      if (lot.status !== 'Sold') continue;

      if (lot.isExternalWinner || !lot.winner) {
        skipped.push({ lotNumber: lot.lotNumber, reason: 'External winner — no platform account' });
        continue;
      }

      const uid = lot.winner._id ? lot.winner._id.toString() : lot.winner.toString();
      if (!buyerMap[uid]) buyerMap[uid] = { winner: lot.winner, lots: [] };
      buyerMap[uid].lots.push(lot);
    }

    const created = [];
    const updated = [];

    for (const [buyerId, { winner, lots: wonLots }] of Object.entries(buyerMap)) {
      // Resolve buyer — already populated or fetch
      const buyer = winner._id ? winner : await User.findById(buyerId);
      if (!buyer) { skipped.push({ buyerId, reason: 'User not found' }); continue; }

      // Get registration for address (platform-wide registration)
      const auctionReg = await AuctionRegistration.findOne({
        userId: buyer._id,
        status: 'approved'
      });

      let billingStreet = '', billingCity = '', billingState = 'Gujarat';
      let billingZipCode = '', buyerGstin = '', buyerPan = '', buyerPhone = '';

      if (auctionReg) {
        const parts = [
          auctionReg.billingAddress?.addressLine1,
          auctionReg.billingAddress?.addressLine2,
          auctionReg.billingAddress?.addressLine3
        ].filter(Boolean);
        billingStreet = parts.join(', ');
        billingCity   = auctionReg.billingAddress?.city || '';
        billingState  = auctionReg.billingAddress?.state || 'Gujarat';
        billingZipCode = auctionReg.billingAddress?.pinCode || '';
        buyerGstin    = auctionReg.gstNumber || '';
        buyerPhone    = auctionReg.mobile || buyer.phone || '';
        buyerPan      = auctionReg.panNumber || (auctionReg.gstNumber ? auctionReg.gstNumber.substring(2, 12) : '');
      } else if (buyer.address) {
        billingStreet  = buyer.address.street || '';
        billingCity    = buyer.address.city || '';
        billingState   = buyer.address.state || 'Gujarat';
        billingZipCode = buyer.address.zipCode || '';
        buyerGstin     = buyer.gstin || '';
        buyerPan       = buyer.pan || '';
        buyerPhone     = buyer.phone || '';
      }

      const buyerStateCode = STATE_CODES[billingState] || '24';
      const gstType = buyerStateCode !== companyStateCode ? 'IGST' : 'CGST+SGST';

      // Check if invoice already exists for this buyer+lotAuction
      let invoice = await AuctionInvoice.findOne({ lotAuction: auction._id, buyer: buyer._id });

      const lotItems = wonLots.map(lot => ({
        lotNumber: lot.lotNumber,
        description: lot.title || `Lot ${lot.lotNumber}`,
        detailedDescription: lot.description || '',
        hsnCode: lot.hsn || '97050090',
        quantity: 1,
        hammerPrice: lot.hammerPrice,
        commissionRate: commissionPercentage
      })).sort((a, b) => a.lotNumber - b.lotNumber);

      if (!invoice) {
        invoice = new AuctionInvoice({
          lotAuction: auction._id,
          buyer: buyer._id,
          buyerDetails: {
            name: buyer.name,
            email: buyer.email,
            phone: buyerPhone,
            gstin: buyerGstin,
            pan: buyerPan,
            buyerNumber: `BUY${buyer._id.toString().slice(-3).toUpperCase()}`,
            commissionPercentage
          },
          billingAddress: { street: billingStreet, city: billingCity, state: billingState, stateCode: buyerStateCode, zipCode: billingZipCode },
          shippingAddress: { street: billingStreet, city: billingCity, state: billingState, stateCode: buyerStateCode, zipCode: billingZipCode },
          lots: lotItems,
          lotNumbers: lotItems.map(l => l.lotNumber),
          packingForwardingCharges: { amount: 0, hsnCode: '99854' },
          insuranceCharges: { amount: 0, hsnCode: '99681', declined: true },
          gst: { type: gstType, rate: 5.00, itemGSTRate: 5.00, packingGSTRate: 18.00 },
          shipping: { transportMode: 'Post/Courier', placeOfSupply: billingState },
          companyDetails: {
            name: 'Chronicle Vaults',
            gstin: '24BCZPD7594Q1ZE',
            pan: 'BCZPD7594Q',
            address: '16/189, Netajinagar, Meghaninagar, Ahmedabad-380016, Gujarat',
            city: 'Ahmedabad',
            state: 'Gujarat',
            stateCode: '24',
            phone: '+918460849878',
            email: 'chroniclevaults@gmail.com',
            bankDetails: {
              bankName: 'Saraswat Bank',
              accountNumber: '610000000016716',
              accountName: 'urhistory',
              ifsc: 'SRCB0000362',
              branch: 'CG Road'
            }
          },
          status: 'Generated'
        });
        await invoice.save();
        created.push({ buyerId, invoiceId: invoice._id, lots: lotItems.length });
      } else {
        // Merge new lots (avoid duplicates)
        const existing = new Set(invoice.lots.map(l => l.lotNumber));
        for (const li of lotItems) {
          if (!existing.has(li.lotNumber)) invoice.lots.push(li);
        }
        invoice.lots.sort((a, b) => a.lotNumber - b.lotNumber);
        invoice.lotNumbers = invoice.lots.map(l => l.lotNumber);
        await invoice.save();
        updated.push({ buyerId, invoiceId: invoice._id, lots: invoice.lots.length });
      }
    }

    return res.json({ success: true, data: { created, updated, skipped } });
  } catch (error) {
    console.error('generateInvoices error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Public: Get active/upcoming auctions ────────────────────────────────────
export const getPublicLotAuctions = async (req, res) => {
  try {
    // LotBidding = either Upcoming (posterDisplayUntil in future) or Active (past/no poster)
    // Paused/ResultsPending/Completed = Ended
    const auctions = await LotAuction.find({
      status: { $in: ['LotBidding', 'Paused', 'ResultsPending', 'Completed'] },
    })
      .sort({ createdAt: -1 })
      .select('title description catalogPdf externalPlatformName externalPlatformLink lotBiddingEndTime posterDisplayUntil status image createdAt');

    return res.json({ success: true, data: auctions });
  } catch (error) {
    console.error('getPublicLotAuctions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Public: Get single auction with lots (hide reserve bid amounts) ─────────
export const getPublicLotAuctionById = async (req, res) => {
  try {
    // Support lookup by originalAuctionId too (for redirects from old /auction/:id URLs)
    let auction = await LotAuction.findOne({
      $or: [
        { _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null },
        { originalAuctionId: req.params.id },
      ],
    }).populate('lots.winner', 'name');

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    // Sanitise: strip maxBid from reserve bids before sending to public
    const sanitised = auction.toObject();
    sanitised.lots = sanitised.lots.map((lot) => {
      lot.bids = lot.bids.map((bid) => {
        if (bid.isReserveBid) {
          const { maxBid, ...rest } = bid; // remove maxBid
          return rest;
        }
        return bid;
      });
      return lot;
    });

    return res.json({ success: true, data: sanitised });
  } catch (error) {
    console.error('getPublicLotAuctionById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Authenticated: Place a bid on a lot ─────────────────────────────────────
const DEFAULT_INCREMENT_SLABS = [
  { minPrice: 1, maxPrice: 1999, increment: 100 },
  { minPrice: 2000, maxPrice: 2999, increment: 200 },
  { minPrice: 3000, maxPrice: 4999, increment: 300 },
  { minPrice: 5000, maxPrice: 9999, increment: 500 },
  { minPrice: 10000, maxPrice: 19999, increment: 1000 },
  { minPrice: 20000, maxPrice: 29999, increment: 2000 },
  { minPrice: 30000, maxPrice: 49999, increment: 3000 },
  { minPrice: 50000, maxPrice: 99999, increment: 5000 },
  { minPrice: 100000, maxPrice: 199999, increment: 10000 },
];

const getLotIncrement = (currentBid) => {
  for (const slab of DEFAULT_INCREMENT_SLABS) {
    if (currentBid >= slab.minPrice && currentBid < slab.maxPrice) return slab.increment;
  }
  return DEFAULT_INCREMENT_SLABS[DEFAULT_INCREMENT_SLABS.length - 1].increment;
};

export const placeBid = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { lotNumber, amount, maxBid, isReserveBid } = req.body;
    const userId = req.user._id;

    const auction = await LotAuction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Lot auction not found' });
    }

    // Check registration — platform-wide
    const registration = await AuctionRegistration.findOne({ userId, status: 'approved' });
    if (!registration) {
      return res.status(403).json({ success: false, message: 'You are not registered. Please register first.' });
    }

    // Check auction status
    if (auction.status !== 'LotBidding') {
      return res.status(400).json({ success: false, message: 'Auction is not currently accepting bids' });
    }

    // Check bidding end time
    if (auction.lotBiddingEndTime && new Date() > new Date(auction.lotBiddingEndTime)) {
      return res.status(400).json({ success: false, message: 'Bidding period has ended' });
    }

    const lot = auction.lots.find((l) => l.lotNumber === Number(lotNumber));
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    if (!['Active', 'Upcoming'].includes(lot.status)) {
      return res.status(400).json({ success: false, message: 'This lot is not open for bidding' });
    }

    // Reserve bids pass amount=0 (hidden until auto-proxy fires); regular bids require a valid amount
    if (!isReserveBid && (!amount || amount <= 0)) {
      return res.status(400).json({ success: false, message: 'A valid bid amount is required' });
    }

    // Find user and check coins
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.isAuctionVerified) {
      return res.status(403).json({ success: false, message: 'You must be auction-verified to place bids' });
    }

    // For reserve bids coins to commit = maxBid; for regular bids = amount
    const coinsRequired = (isReserveBid && maxBid) ? maxBid : amount;
    if (user.auctionCoins < coinsRequired) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You have ₹${user.auctionCoins.toLocaleString()} coins but need ₹${coinsRequired.toLocaleString()} coins`
      });
    }

    // Current highest bid = only bids with amount > 0 (fresh reserve bids have amount=0 — hidden until auto-proxy fires)
    const activeBids = lot.bids.filter(b => b.amount > 0);
    const currentBid = activeBids.length > 0 ? Math.max(...activeBids.map(b => b.amount)) : null;

    // Minimum bid
    let minBid;
    if (currentBid) {
      minBid = currentBid + getLotIncrement(currentBid);
    } else {
      minBid = lot.startingPrice || 0;
    }

    // Validate: maxBid for reserve bids, amount for regular bids
    const bidToValidate = (isReserveBid && maxBid) ? maxBid : amount;
    if (bidToValidate < minBid) {
      return res.status(400).json({ success: false, message: `Minimum bid is ₹${minBid.toLocaleString('en-IN')}` });
    }

    // REBID GUARD: if user is already the highest bidder, treat new bid as reserve update (same as live auction)
    if (currentBid && activeBids.length > 0) {
      // Tiebreaker: same amount → latest timestamp wins
      const highestActiveBid = activeBids.sort((a, b) => b.amount - a.amount || new Date(b.timestamp) - new Date(a.timestamp))[0];
      if (highestActiveBid && String(highestActiveBid.user) === String(userId)) {
        // User is already winning — update or create their reserve
        const existingReserve = lot.bids.find(b => b.isReserveBid && String(b.user) === String(userId));
        const newMaxBid = (isReserveBid && maxBid) ? maxBid : amount;
        if (newMaxBid <= currentBid) {
          return res.status(400).json({ success: false, message: `Your reserve must be higher than current bid of ₹${currentBid.toLocaleString('en-IN')}` });
        }
        // Adjust frozen coins for the diff
        await freezeCoinsForLot(userId, req.params.id, lot.lotNumber, newMaxBid);
        if (existingReserve) {
          existingReserve.maxBid = newMaxBid;
          existingReserve.timestamp = new Date();
        } else {
          lot.bids.push({ user: userId, amount: 0, maxBid: newMaxBid, isReserveBid: true, timestamp: new Date() });
        }
        await auction.save();
        const finalAuction = await LotAuction.findById(req.params.id).populate('lots.bids.user', 'name email');
        const updatedUserAfter = await User.findById(userId);
        if (io) {
          io.to(`user-${userId}`).emit('coin-balance-updated', {
            auctionCoins: updatedUserAfter.auctionCoins,
            frozenCoins: updatedUserAfter.frozenCoins,
            reason: 'Reserve updated',
            lotNumber: lot.lotNumber
          });
        }
        return res.json({
          success: true,
          reserveUpdated: true,
          message: `Reserve updated to ₹${newMaxBid.toLocaleString('en-IN')}`,
          data: { auction: finalAuction.toObject(), auctionCoins: updatedUserAfter.auctionCoins }
        });
      }
    }

    // Auto-proxy: when a regular bid comes in, check if a reserve bidder outbids it
    if (!isReserveBid) {
      const topReserve = lot.bids
        .filter(b => b.isReserveBid && b.maxBid != null && b.maxBid >= amount && String(b.user) !== String(userId))
        .sort((a, b) => b.maxBid - a.maxBid)[0];

      if (topReserve) {
        // Beat by slab increment, capped at reserve bidder's maxBid
        const autoBidAmount = Math.min(topReserve.maxBid, amount + getLotIncrement(amount));
        topReserve.amount = autoBidAmount;
        topReserve.timestamp = new Date();
        await auction.save();

        const finalAuction = await LotAuction.findById(req.params.id).populate('lots.bids.user', 'name email');
        if (io) {
          io.to(`auction-${req.params.id}`).emit('bid-placed', {
            auctionId: req.params.id,
            auction: finalAuction.toObject(),
            currentLot: finalAuction.lots.find(l => l.lotNumber === Number(lotNumber))?.toObject() || null,
            bidder: topReserve.user,
          });
          io.to(`user-${topReserve.user}`).emit('coin-balance-updated', {
            auctionCoins: (await User.findById(topReserve.user))?.auctionCoins,
            reason: 'Auto-bid placed on your behalf',
            lotNumber: lot.lotNumber
          });
        }
        return res.json({
          success: true,
          outbid: true,
          data: { auction: finalAuction.toObject(), auctionCoins: user.auctionCoins }
        });
      }
    }

    // Only unfreeze the previous regular bidder (reserve bidders keep their coins frozen)
    let previousWinnerId = null;
    if (!isReserveBid) {
      const nonReserveBids = lot.bids.filter(b => !b.isReserveBid && b.amount > 0);
      if (nonReserveBids.length > 0) {
        const highestRegularBid = [...nonReserveBids].sort((a, b) => b.amount - a.amount || new Date(b.timestamp) - new Date(a.timestamp))[0];
        if (highestRegularBid && String(highestRegularBid.user) !== String(userId)) {
          previousWinnerId = highestRegularBid.user;
        }
      }
    }

    // Freeze coins
    await freezeCoinsForLot(userId, req.params.id, lot.lotNumber, coinsRequired);
    const updatedUser = await User.findById(userId);

    // Unfreeze previous regular winner
    if (previousWinnerId) {
      try {
        const unfreezeResult = await unfreezeCoinsForLot(previousWinnerId, req.params.id, lot.lotNumber);
        if (unfreezeResult && io) {
          io.to(`user-${previousWinnerId}`).emit('coin-balance-updated', {
            auctionCoins: unfreezeResult.user.auctionCoins,
            frozenCoins: unfreezeResult.user.frozenCoins,
            reason: 'Outbid - coins refunded',
            lotNumber: lot.lotNumber
          });
        }
      } catch {
        // Non-fatal
      }
    }

    // Add the new bid (reserve bids stored with amount=0 until auto-proxy fires)
    const newBid = {
      user: userId,
      amount: isReserveBid ? 0 : amount,
      timestamp: new Date(),
      isReserveBid: !!isReserveBid,
    };
    if (isReserveBid && maxBid) newBid.maxBid = maxBid;

    lot.bids.push(newBid);
    if (lot.status === 'Upcoming') lot.status = 'Active';

    await auction.save();

    // Re-fetch with populated bids for socket/response
    const updatedAuction = await LotAuction.findById(req.params.id)
      .populate('lots.bids.user', 'name email');
    const updatedLot = updatedAuction.lots.find(l => l.lotNumber === Number(lotNumber));

    // Emit real-time events
    if (io) {
      io.to(`auction-${req.params.id}`).emit('bid-placed', {
        auctionId: req.params.id,
        auction: updatedAuction.toObject(),
        currentLot: updatedLot ? updatedLot.toObject() : null,
        bidder: userId,
      });
      io.to(`user-${userId}`).emit('coin-balance-updated', {
        auctionCoins: updatedUser.auctionCoins,
        frozenCoins: updatedUser.frozenCoins,
        reason: 'Bid placed - coins deducted',
        lotNumber: lot.lotNumber
      });
    }

    // Strip other users' reserve maxBid from response
    const returnLot = updatedLot ? updatedLot.toObject() : lot.toObject();
    returnLot.bids = returnLot.bids.map((bid) => {
      if (bid.isReserveBid && String(bid.user?._id || bid.user) !== String(userId)) {
        const { maxBid: _m, ...rest } = bid;
        return rest;
      }
      return bid;
    });

    return res.json({
      success: true,
      outbid: false,
      data: {
        lot: returnLot,
        auction: updatedAuction.toObject(),
        auctionCoins: updatedUser.auctionCoins
      }
    });
  } catch (error) {
    console.error('placeBid error:', error);
    if (error.message === 'Insufficient auction coins') {
      return res.status(400).json({ success: false, message: 'Insufficient auction coins' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: Migrate live Auction → LotAuction ────────────────────────────────
export const migrateAuctionToLot = async (req, res) => {
  try {
    const { auctionId } = req.params;

    // Check not already migrated
    const existing = await LotAuction.findOne({ originalAuctionId: auctionId });
    if (existing) {
      return res.json({ success: true, alreadyMigrated: true, data: existing, message: 'Already migrated. Existing LotAuction returned.' });
    }

    const auction = await Auction.findById(auctionId).populate('lots.bids.user', 'name email').lean();
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });

    // Map lots
    const mappedLots = (auction.lots || []).map(lot => {
      const mappedBids = (lot.bids || [])
        .filter(b => b.user) // skip system bids with no user
        .map(b => ({
          user: b.user._id || b.user,
          amount: b.amount || 0,
          maxBid: b.maxBid || null,
          isReserveBid: b.isReserveBidder || false,
          isAutoBid: b.isAutoBid || false,
          isSystemBid: b.isSystemBid || false,
          isCatalogBid: b.isCatalogBid || false,
          ipAddress: b.ipAddress || null,
          userAgent: b.userAgent || null,
          timestamp: b.timestamp || new Date(),
        }));

      return {
        lotNumber: lot.lotNumber,
        title: lot.title || `Lot ${lot.lotNumber}`,
        description: lot.description || '',
        images: lot.images?.length ? lot.images : (lot.image ? [lot.image] : []),
        startingPrice: lot.startingPrice || 0,
        reservePrice: lot.reservePrice || undefined,
        estimatedPrice: lot.estimatedPrice ? String(lot.estimatedPrice) : undefined,
        status: ['Sold', 'Unsold'].includes(lot.status) ? lot.status : 'Active',
        winner: lot.winner || null,
        hammerPrice: lot.currentBid || undefined,
        bids: mappedBids,
      };
    });

    // Determine status
    let newStatus = 'LotBidding';
    if (auction.status === 'Ended') newStatus = 'ResultsPending';
    else if (auction.status === 'Active') newStatus = 'LotBidding';

    const lotAuction = await LotAuction.create({
      title: auction.title,
      description: auction.description || '',
      image: auction.image || auction.posterImage || '',
      lotBiddingEndTime: auction.endTime || auction.currentLotEndTime || null,
      status: newStatus,
      lots: mappedLots,
      originalAuctionId: auction._id,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: `Migration complete! ${mappedLots.length} lots migrated.`,
      data: { _id: lotAuction._id, title: lotAuction.title, lotsCount: mappedLots.length },
    });
  } catch (error) {
    console.error('migrateAuctionToLot error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
