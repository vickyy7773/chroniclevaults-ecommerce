import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuctionInvoice from '../models/AuctionInvoice.js';
import AuctionRegistration from '../models/AuctionRegistration.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Indian state codes mapping
const STATE_CODES = {
  'Andhra Pradesh': '37',
  'Arunachal Pradesh': '12',
  'Assam': '18',
  'Bihar': '10',
  'Chhattisgarh': '22',
  'Goa': '30',
  'Gujarat': '24',
  'Haryana': '06',
  'Himachal Pradesh': '02',
  'Jharkhand': '20',
  'Karnataka': '29',
  'Kerala': '32',
  'Madhya Pradesh': '23',
  'Maharashtra': '27',
  'Manipur': '14',
  'Meghalaya': '17',
  'Mizoram': '15',
  'Nagaland': '13',
  'Odisha': '21',
  'Punjab': '03',
  'Rajasthan': '08',
  'Sikkim': '11',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Tripura': '16',
  'Uttar Pradesh': '09',
  'Uttarakhand': '05',
  'West Bengal': '19',
  'Delhi': '07',
  'Jammu and Kashmir': '01',
  'Ladakh': '38',
  'Puducherry': '34',
  'Chandigarh': '04',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Lakshadweep': '31',
  'Andaman and Nicobar Islands': '35'
};

async function migrateInvoiceAddresses() {
  try {
    console.log('🚀 Starting invoice address migration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all invoices
    const invoices = await AuctionInvoice.find({}).populate('buyer');
    console.log(`📋 Found ${invoices.length} invoices to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const invoice of invoices) {
      try {
        if (!invoice.buyer) {
          console.log(`⚠️  Skipping invoice ${invoice.invoiceNumber} - No buyer found`);
          skippedCount++;
          continue;
        }

        // Try to get auction registration data
        const auctionReg = await AuctionRegistration.findOne({
          userId: invoice.buyer._id,
          status: 'approved'
        });

        if (!auctionReg) {
          console.log(`⚠️  No auction registration found for invoice ${invoice.invoiceNumber} (Buyer: ${invoice.buyer.email})`);
          skippedCount++;
          continue;
        }

        console.log(`🔄 Processing invoice ${invoice.invoiceNumber}...`);

        // Prepare address data from auction registration
        const addressParts = [
          auctionReg.billingAddress.addressLine1,
          auctionReg.billingAddress.addressLine2,
          auctionReg.billingAddress.addressLine3
        ].filter(Boolean);

        const billingStreet = addressParts.join(', ');
        const billingCity = auctionReg.billingAddress.city;
        const billingState = auctionReg.billingAddress.state;
        const billingZipCode = auctionReg.billingAddress.pinCode;
        const buyerGstin = auctionReg.gstNumber || '';
        const buyerPan = auctionReg.gstNumber ? auctionReg.gstNumber.substring(2, 12) : '';
        const buyerStateCode = STATE_CODES[billingState] || '27';

        // Update invoice
        invoice.buyerDetails.gstin = buyerGstin;
        invoice.buyerDetails.pan = buyerPan;

        invoice.billingAddress = {
          street: billingStreet,
          city: billingCity,
          state: billingState,
          stateCode: buyerStateCode,
          zipCode: billingZipCode
        };

        invoice.shippingAddress = {
          street: billingStreet,
          city: billingCity,
          state: billingState,
          stateCode: buyerStateCode,
          zipCode: billingZipCode
        };

        // Update GST type based on state
        const companyStateCode = '27'; // Maharashtra
        const isInterstate = buyerStateCode !== companyStateCode;
        invoice.gst.type = isInterstate ? 'IGST' : 'CGST+SGST';

        await invoice.save();

        console.log(`✅ Updated invoice ${invoice.invoiceNumber}`);
        console.log(`   Address: ${billingStreet}, ${billingCity}, ${billingState} - ${billingZipCode}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error processing invoice ${invoice.invoiceNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount} invoices`);
    console.log(`   ⚠️  Skipped: ${skippedCount} invoices`);
    console.log(`   ❌ Errors: ${errorCount} invoices`);
    console.log('\n🎉 Migration completed!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateInvoiceAddresses();
