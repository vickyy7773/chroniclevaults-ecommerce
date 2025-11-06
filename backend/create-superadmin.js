import mongoose from 'mongoose';
import User from './models/User.js';

const createSuperAdmin = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Delete existing admin
    await User.deleteOne({ email: 'admin@chroniclevaults.com' });

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@chroniclevaults.com',
      password: 'Admin123',
      legacyRole: 'superadmin',  // SUPER ADMIN role
      isEmailVerified: true
    });

    console.log('✅ Super Admin created!');
    console.log('👤 Name: Super Admin');
    console.log('📧 Email: admin@chroniclevaults.com');
    console.log('🔑 Password: Admin123');
    console.log('👑 Role: SUPER ADMIN');

    // Test password
    const testUser = await User.findOne({ email: 'admin@chroniclevaults.com' }).select('+password');
    const isMatch = await testUser.comparePassword('Admin123');

    console.log(`\n🧪 Password test: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`🔐 Role test: ${testUser.legacyRole === 'superadmin' ? '✅ SUPER ADMIN' : '❌ NOT SUPER ADMIN'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createSuperAdmin();
