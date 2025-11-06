import mongoose from 'mongoose';
import User from './models/User.js';

const checkUser = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'admin@chroniclevaults.com' }).select('+password');

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('\n📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Password Hash:', user.password);
    console.log('🔐 Hash Length:', user.password ? user.password.length : 0);
    console.log('👑 Legacy Role:', user.legacyRole);
    console.log('✉️  Email Verified:', user.isEmailVerified);

    // Test password comparison
    console.log('\n🧪 Testing password comparison...');
    const testPassword = 'admin123';
    const isMatch = await user.comparePassword(testPassword);
    console.log(`Password "admin123" matches: ${isMatch ? '✅ YES' : '❌ NO'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUser();
