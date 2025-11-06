import mongoose from 'mongoose';
import User from './models/User.js';

const fixPassword = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Delete and recreate with CAPITAL A
    await User.deleteOne({ email: 'admin@chroniclevaults.com' });

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@chroniclevaults.com',
      password: 'Admin123',  // CAPITAL A
      legacyRole: 'admin',
      isEmailVerified: true
    });

    console.log('✅ Admin user created with password: Admin123');

    // Test it
    const testUser = await User.findOne({ email: 'admin@chroniclevaults.com' }).select('+password');
    const isMatch = await testUser.comparePassword('Admin123');

    console.log(`🧪 Password test (Admin123): ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPassword();
