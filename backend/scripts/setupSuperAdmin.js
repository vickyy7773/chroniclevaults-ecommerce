import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';

dotenv.config();

const setupSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // First, seed roles if not exist
    console.log('📝 Checking roles...');

    const defaultRoles = [
      {
        name: 'superadmin',
        displayName: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: {
          users: { view: true, create: true, edit: true, delete: true },
          products: { view: true, create: true, edit: true, delete: true },
          orders: { view: true, edit: true, delete: true },
          categories: { view: true, create: true, edit: true, delete: true },
          blogs: { view: true, create: true, edit: true, delete: true },
          roles: { view: true, create: true, edit: true, delete: true },
          admins: { create: true, edit: true, delete: true },
          dashboard: { access: true }
        },
        isSystemRole: true
      },
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative access',
        permissions: {
          users: { view: true, create: false, edit: true, delete: false },
          products: { view: true, create: true, edit: true, delete: true },
          orders: { view: true, edit: true, delete: false },
          categories: { view: true, create: true, edit: true, delete: true },
          blogs: { view: true, create: true, edit: true, delete: true },
          roles: { view: true, create: false, edit: false, delete: false },
          admins: { create: false, edit: false, delete: false },
          dashboard: { access: true }
        },
        isSystemRole: true
      },
      {
        name: 'user',
        displayName: 'User',
        description: 'Regular user',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          products: { view: true, create: false, edit: false, delete: false },
          orders: { view: true, edit: false, delete: false },
          categories: { view: true, create: false, edit: false, delete: false },
          blogs: { view: true, create: false, edit: false, delete: false },
          roles: { view: false, create: false, edit: false, delete: false },
          admins: { create: false, edit: false, delete: false },
          dashboard: { access: false }
        },
        isSystemRole: true
      }
    ];

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.displayName}`);
      } else {
        console.log(`⚠️  Role '${roleData.name}' already exists`);
      }
    }

    // Setup admin@vintagecoin.com as super admin
    console.log('\n📝 Setting up admin@vintagecoin.com as Super Admin...');

    let admin = await User.findOne({ email: 'admin@vintagecoin.com' });

    // Get superadmin role
    const superAdminRole = await Role.findOne({ name: 'superadmin' });

    if (!admin) {
      console.log('⚠️  User admin@vintagecoin.com not found. Creating new super admin...');

      // Create new super admin
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@vintagecoin.com',
        password: 'Admin@123',
        legacyRole: 'superadmin',
        role: superAdminRole ? superAdminRole._id : null,
        isEmailVerified: true
      });

      console.log('✅ Created new super admin account!');
    } else {
      console.log('⚠️  User exists. Updating to super admin...');

      // Update existing user to super admin
      admin.legacyRole = 'superadmin';
      admin.role = superAdminRole ? superAdminRole._id : null;
      admin.isEmailVerified = true;
      await admin.save();

      console.log('✅ Updated existing user to super admin!');
    }

    console.log('\n✅ SUCCESS! admin@vintagecoin.com is now Super Admin!');
    console.log('\n📋 Credentials:');
    console.log('   ════════════════════════════════════');
    console.log(`   Email:    admin@vintagecoin.com`);
    console.log(`   Password: Admin@123`);
    console.log('   ════════════════════════════════════');
    console.log('\n📋 User Details:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.legacyRole}`);
    console.log('\n🎉 You can now:');
    console.log('   1. Login with: admin@vintagecoin.com / Admin@123');
    console.log('   2. Access Admin Dashboard');
    console.log('   3. Manage Roles at /admin/roles');
    console.log('   4. Create new admins at /admin/admins');
    console.log('   5. Assign roles to users');
    console.log('   6. Full system access with all permissions!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

setupSuperAdmin();
