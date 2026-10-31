import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    maxBid: { type: Number, default: null },
    isReserveBid: { type: Boolean, default: false },
    isAutoBid: { type: Boolean, default: false },
    isSystemBid: { type: Boolean, default: false },
    isCatalogBid: { type: Boolean, default: false },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const lotSchema = new mongoose.Schema(
  {
    lotNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    images: [{ type: String }],
    startingPrice: { type: Number, required: true },
    reservePrice: { type: Number },
    estimatedPrice: { type: String },
    hsn: { type: String },
    status: {
      type: String,
      enum: ['Upcoming', 'Active', 'Sold', 'Unsold'],
      default: 'Upcoming',
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    hammerPrice: { type: Number },
    winnerName: { type: String },
    winnerPhone: { type: String },
    winnerEmail: { type: String },
    isExternalWinner: { type: Boolean, default: false },
    bids: [bidSchema],
  },
  { _id: true }
);

const lotAuctionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    catalogPdf: { type: String },
    externalPlatformName: { type: String },
    externalPlatformLink: { type: String },
    lotBiddingEndTime: { type: Date },
    status: {
      type: String,
      enum: ['Draft', 'LotBidding', 'Paused', 'ResultsPending', 'Completed', 'Cancelled'],
      default: 'LotBidding',
    },
    lots: [lotSchema],
    image: { type: String },
    posterDisplayUntil: { type: Date, required: false },
    shortCode: { type: String, default: null, sparse: true },
    originalAuctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

lotAuctionSchema.index({ shortCode: 1 }, { unique: true, sparse: true });

const LotAuction = mongoose.model('LotAuction', lotAuctionSchema);
export default LotAuction;
