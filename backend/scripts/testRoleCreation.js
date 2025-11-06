import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './models/Role.js';
import User from './models/User.js';

dotenv.config();

const testRoleCreation = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Get super admin user
    const superAdmin = await User.findOne({ email: 'admin@vintagecoin.com' }).populate('role');

    if (!superAdmin) {
      console.log('❌ Super admin not found!');
      process.exit(1);
    }

    console.log('📝 Super Admin Details:');
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Legacy Role: ${superAdmin.legacyRole}`);
    console.log(`   Role ID: ${superAdmin.role?._id || 'None'}\n`);

    // Try to create a test role
    console.log('🔨 Creating test role...');

    const testRole = {
      name: 'test-manager',
      displayName: 'Test Manager',
      description: 'Test role for debugging',
      permissions: {
        users: { view: true, create: false, edit: false, delete: false },
        products: { view: true, create: true, edit: true, delete: false },
        orders: { view: true, edit: false, delete: false },
        categories: { view: true, create: false, edit: false, delete: false },
        blogs: { view: true, create: false, edit: false, delete: false },
        roles: { view: false, create: false, edit: false, delete: false },
        admins: { create: false, edit: false, delete: false },
        dashboard: { access: true }
      },
      createdBy: superAdmin._id,
      isSystemRole: false
    };

    // Check if role already exists
    const existing = await Role.findOne({ name: 'test-manager' });
    if (existing) {
      console.log('⚠️  Test role already exists. Deleting...');
      await Role.deleteOne({ name: 'test-manager' });
    }

    // Create the role
    const newRole = await Role.create(testRole);

    console.log('✅ Test role created successfully!\n');
    console.log('📋 Role Details:');
    console.log(`   Name: ${newRole.name}`);
    console.log(`   Display Name: ${newRole.displayName}`);
    console.log(`   Description: ${newRole.description}`);
    console.log(`   Created By: ${newRole.createdBy}`);
    console.log(`   Is System Role: ${newRole.isSystemRole}\n`);

    console.log('✅ Role creation test PASSED!');
    console.log('💡 This means the backend is working fine.');
    console.log('   The 500 error might be coming from:');
    console.log('   1. Missing/invalid auth token in frontend');
    console.log('   2. User not logged in properly');
    console.log('   3. CORS issue\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

testRoleCreation();
