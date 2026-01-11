import mongoose from 'mongoose';

const auctionRegistrationSchema = new mongoose.Schema({
  // Personal Information
  title: {
    type: String,
    enum: ['Mr.', 'Mrs.', 'Miss'],
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  stateCode: {
    type: String,
    trim: true
  },

  // Billing Address
  billingAddress: {
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: String,
    addressLine3: String,
    country: {
      type: String,
      default: 'India',
      required: true
    },
    state: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    pinCode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/
    }
  },

  // Shipping Address
  sameAsBilling: {
    type: Boolean,
    default: false
  },
  shippingAddress: {
    addressLine1: String,
    addressLine2: String,
    addressLine3: String,
    country: String,
    state: String,
    city: String,
    pinCode: {
      type: String,
      match: /^[0-9]{6}$/
    }
  },

  // Contact Details
  mobile: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/
  },
  phone: String,
  website: String,

  // Documents
  panCard: {
    type: String, // URL to uploaded file or base64
    required: false
  },
  panNumber: {
    type: String,
    required: false,
    uppercase: true,
    trim: true
  },
  idProof: {
    proofType: {
      type: String,
      enum: ['aadhar', 'govt-id', 'passport'],
      required: false
    },
    url: {
      type: String, // URL to uploaded file or base64
      required: false
    }
  },

  // Collecting Interests
  collectingInterests: {
    type: String,
    trim: true
  },

  // References (2-3 dealer/collector references)
  references: [{
    name: String,
    city: String,
    mobile: String
  }],

  // User link (after approval, link to User model)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Registration Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,

  // Admin notes
  adminNotes: String,

  // Unique Auction ID (generated after approval)
  auctionId: {
    type: String,
    unique: true,
    sparse: true // Only enforce uniqueness for non-null values
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectedAt: Date

}, {
  timestamps: true
});

export default mongoose.model('AuctionRegistration', auctionRegistrationSchema);
