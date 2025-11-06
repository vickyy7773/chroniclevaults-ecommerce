import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Admin user details
    const adminEmail = 'admin@chroniclevaults.com';
    const adminPassword = 'Admin@123';
    const adminName = 'Super Admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Updating to admin role...');

      existingAdmin.legacyRole = 'admin';
      await existingAdmin.save();

      console.log('✅ Updated existing user to admin role');
      console.log('\n📧 Email:', adminEmail);
      console.log('🔑 Password: (unchanged)');
    } else {
      // Create new admin user
      const adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        legacyRole: 'admin'
      });

      console.log('✅ Admin user created successfully!');
      console.log('\n📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      console.log('\n⚠️  Please change the password after first login!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Also create a function to update any existing user to admin
const updateUserToAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    user.legacyRole = 'admin';
    await user.save();

    console.log('✅ User updated to admin role');
    console.log('📧 Email:', email);
    console.log('👤 Name:', user.name);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Check if email argument is provided
const args = process.argv.slice(2);
if (args.length > 0 && args[0]) {
  updateUserToAdmin(args[0]);
} else {
  createAdminUser();
}
