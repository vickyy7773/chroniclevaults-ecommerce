import mongoose from 'mongoose';
import User from './models/User.js';

const resetAdmin = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Delete existing admin user
    const deleted = await User.deleteOne({ email: 'admin@chroniclevaults.com' });
    console.log(`🗑️  Deleted ${deleted.deletedCount} user(s)`);

    // Create fresh admin user (pre-save hook will hash password)
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@chroniclevaults.com',
      password: 'admin123',  // Will be hashed by pre-save hook
      legacyRole: 'admin',
      isEmailVerified: true
    });

    console.log('✅ Fresh admin user created!');
    console.log('📧 Email: admin@chroniclevaults.com');
    console.log('🔑 Password: admin123');

    // Test password immediately
    const testUser = await User.findOne({ email: 'admin@chroniclevaults.com' }).select('+password');
    const isMatch = await testUser.comparePassword('admin123');

    console.log(`\n🧪 Password test: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();
