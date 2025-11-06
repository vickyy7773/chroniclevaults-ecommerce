import mongoose from 'mongoose';
import User from './models/User.js';

const createAdmin = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@chroniclevaults.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email: admin@chroniclevaults.com');
      process.exit(0);
    }

    // Create admin user (password will be hashed by pre-save hook)
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@chroniclevaults.com',
      password: 'admin123',
      legacyRole: 'admin',
      isEmailVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@chroniclevaults.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();
