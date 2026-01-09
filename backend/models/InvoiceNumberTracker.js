import mongoose from 'mongoose';

const invoiceNumberTrackerSchema = new mongoose.Schema({
  // Singleton document - only one document will exist
  _id: {
    type: String,
    default: 'invoice_tracker'
  },

  // Current sequence number (next number to use)
  currentSequence: {
    type: Number,
    default: 1
  },

  // Array of deleted invoice numbers available for reassignment
  availableNumbers: [{
    number: {
      type: Number,
      required: true
    },
    invoiceNumber: {
      type: String,
      required: true
    },
    deletedAt: {
      type: Date,
      default: Date.now
    },
    originalInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionInvoice'
    }
  }],

  // History of assigned numbers
  assignmentHistory: [{
    number: Number,
    invoiceNumber: String,
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuctionInvoice'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    wasReassigned: {
      type: Boolean,
      default: false
    }
  }]

}, {
  timestamps: true
});

// Static method to get or create tracker
invoiceNumberTrackerSchema.statics.getTracker = async function() {
  let tracker = await this.findById('invoice_tracker');
  if (!tracker) {
    tracker = await this.create({ _id: 'invoice_tracker', currentSequence: 1 });
  }
  return tracker;
};

// Static method to get next available number
invoiceNumberTrackerSchema.statics.getNextNumber = async function() {
  const tracker = await this.getTracker();

  // Check if there are any available deleted numbers
  if (tracker.availableNumbers.length > 0) {
    // Return the oldest deleted number
    const availableNum = tracker.availableNumbers[0];
    return {
      number: availableNum.number,
      invoiceNumber: availableNum.invoiceNumber,
      isReassigned: true,
      availableId: availableNum._id
    };
  }

  // Otherwise, use next sequential number
  const number = tracker.currentSequence;
  const invoiceNumber = `B/SALE${number}`;

  return {
    number,
    invoiceNumber,
    isReassigned: false
  };
};

// Static method to assign a number (either auto or manual)
invoiceNumberTrackerSchema.statics.assignNumber = async function(invoiceId, manualNumber = null) {
  const tracker = await this.getTracker();

  let assignedNumber;
  let invoiceNumber;
  let wasReassigned = false;

  if (manualNumber) {
    // Manual assignment - find this number in available numbers
    const availableIndex = tracker.availableNumbers.findIndex(
      item => item.number === parseInt(manualNumber)
    );

    if (availableIndex === -1) {
      throw new Error('Selected invoice number is not available for reassignment');
    }

    const availableNum = tracker.availableNumbers[availableIndex];
    assignedNumber = availableNum.number;
    invoiceNumber = availableNum.invoiceNumber;
    wasReassigned = true;

    // Remove from available numbers
    tracker.availableNumbers.splice(availableIndex, 1);
  } else {
    // Auto assignment - check for available deleted numbers first
    if (tracker.availableNumbers.length > 0) {
      const availableNum = tracker.availableNumbers.shift(); // Remove first available
      assignedNumber = availableNum.number;
      invoiceNumber = availableNum.invoiceNumber;
      wasReassigned = true;
    } else {
      // Use next sequential number
      assignedNumber = tracker.currentSequence;
      invoiceNumber = `B/SALE${assignedNumber}`;
      tracker.currentSequence += 1;
    }
  }

  // Add to assignment history
  tracker.assignmentHistory.push({
    number: assignedNumber,
    invoiceNumber,
    invoiceId,
    wasReassigned
  });

  await tracker.save();

  return {
    number: assignedNumber,
    invoiceNumber,
    wasReassigned
  };
};

// Static method to mark a number as available when invoice is deleted
invoiceNumberTrackerSchema.statics.markNumberAvailable = async function(invoiceNumber, invoiceId) {
  const tracker = await this.getTracker();

  // Extract number from invoice number (B/SALE123 -> 123)
  const numberMatch = invoiceNumber.match(/B\/SALE(\d+)/);
  if (!numberMatch) {
    throw new Error('Invalid invoice number format');
  }

  const number = parseInt(numberMatch[1]);

  // Check if this number is already in available list
  const alreadyAvailable = tracker.availableNumbers.some(item => item.number === number);
  if (alreadyAvailable) {
    return; // Already marked as available
  }

  // Add to available numbers (maintain sorted order)
  tracker.availableNumbers.push({
    number,
    invoiceNumber,
    deletedAt: new Date(),
    originalInvoiceId: invoiceId
  });

  // Sort available numbers in ascending order
  tracker.availableNumbers.sort((a, b) => a.number - b.number);

  await tracker.save();
};

// Static method to get all available numbers for manual selection
invoiceNumberTrackerSchema.statics.getAvailableNumbers = async function() {
  const tracker = await this.getTracker();
  return tracker.availableNumbers.sort((a, b) => a.number - b.number);
};

export default mongoose.model('InvoiceNumberTracker', invoiceNumberTrackerSchema);
