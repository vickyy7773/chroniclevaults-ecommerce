import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AuctionInvoice from '../models/AuctionInvoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../.env') });

const updateInvoiceBankDetails = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chroniclevaults';
    console.log(`📡 Using MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//<credentials>@')}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // New bank details
    const newBankDetails = {
      bankName: 'Saraswat Bank',
      accountName: 'urhistory',
      accountNumber: '610000000016716',
      ifsc: 'SRCB000362',
      branch: 'CG Road'
    };

    console.log('\n📊 Fetching all invoices...');
    const invoices = await AuctionInvoice.find({});
    console.log(`📦 Found ${invoices.length} invoices to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    console.log('\n🔄 Starting update process...\n');

    for (const invoice of invoices) {
      try {
        // Update bank details
        if (!invoice.companyDetails) {
          invoice.companyDetails = {};
        }

        invoice.companyDetails.bankDetails = newBankDetails;

        await invoice.save();
        updatedCount++;
        console.log(`✅ Updated invoice: ${invoice.invoiceNumber}`);
      } catch (error) {
        skippedCount++;
        console.log(`❌ Failed to update invoice ${invoice.invoiceNumber}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updatedCount} invoices`);
    console.log(`❌ Failed/Skipped: ${skippedCount} invoices`);
    console.log(`📦 Total invoices: ${invoices.length}`);
    console.log('='.repeat(60));

    console.log('\n✨ Migration completed successfully!');
    console.log('🏦 All invoices now have Saraswat Bank details\n');

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the migration
updateInvoiceBankDetails();
