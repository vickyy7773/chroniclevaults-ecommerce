import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function makeAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Make the new user admin
    const email = 'newadmin@chroniclevaults.com';

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`📝 Current user details:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log('\n✅ User updated to ADMIN!\n');

    console.log('============================================');
    console.log('🎉 ADMIN CREDENTIALS READY!');
    console.log('============================================\n');
    console.log('Email: newadmin@chroniclevaults.com');
    console.log('Password: Admin@123\n');
    console.log('============================================');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Done!\n');
  }
}

makeAdmin();
