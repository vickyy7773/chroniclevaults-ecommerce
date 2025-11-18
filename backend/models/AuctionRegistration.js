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
    type: String, // URL to uploaded file
    required: true
  },
  idProof: {
    type: String, // aadhar/govt-id/passport
    proofType: {
      type: String,
      enum: ['aadhar', 'govt-id', 'passport'],
      required: true
    },
    url: {
      type: String, // URL to uploaded file
      required: true
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
