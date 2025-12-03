import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  vendorCode: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Please provide vendor name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  address: {
    type: String,
    required: [true, 'Please provide address'],
    trim: true
  },
  kycDocuments: {
    aadharCard: {
      type: String,
      required: [true, 'Please upload Aadhar Card']
    },
    panCard: {
      type: String,
      required: [true, 'Please upload PAN Card']
    }
  },
  commissionPercentage: {
    type: Number,
    required: [true, 'Please provide commission percentage'],
    min: [0, 'Commission cannot be negative'],
    max: [100, 'Commission cannot exceed 100%'],
    default: 0
  },
  bankDetails: {
    accountHolderName: {
      type: String,
      required: [true, 'Please provide account holder name'],
      trim: true
    },
    accountNumber: {
      type: String,
      required: [true, 'Please provide account number'],
      trim: true
    },
    ifscCode: {
      type: String,
      required: [true, 'Please provide IFSC code'],
      trim: true,
      uppercase: true
    },
    bankName: {
      type: String,
      required: [true, 'Please provide bank name'],
      trim: true
    },
    branchName: {
      type: String,
      trim: true
    }
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Generate unique vendor code if not provided
vendorSchema.pre('save', async function(next) {
  if (!this.vendorCode) {
    const count = await this.constructor.countDocuments();
    this.vendorCode = `VEN${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
