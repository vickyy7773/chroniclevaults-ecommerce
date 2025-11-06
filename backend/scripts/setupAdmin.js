import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const setupAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all existing users
    const deletedUsers = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} existing users`);

    // Delete all existing roles
    const deletedRoles = await Role.deleteMany({});
    console.log(`🗑️  Deleted ${deletedRoles.deletedCount} existing roles`);

    // Create Super Admin Role
    const superAdminRole = await Role.create({
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full system access',
      permissions: {
        products: { create: true, read: true, update: true, delete: true },
        users: { create: true, read: true, update: true, delete: true },
        orders: { create: true, read: true, update: true, delete: true },
        categories: { create: true, read: true, update: true, delete: true },
        blogs: { create: true, read: true, update: true, delete: true },
        roles: { create: true, read: true, update: true, delete: true },
        settings: { create: true, read: true, update: true, delete: true }
      }
    });
    console.log('✅ Created Super Admin role');

    // Create Admin Role
    const adminRole = await Role.create({
      name: 'admin',
      displayName: 'Admin',
      description: 'Administrative access',
      permissions: {
        products: { create: true, read: true, update: true, delete: true },
        users: { create: false, read: true, update: true, delete: false },
        orders: { create: true, read: true, update: true, delete: false },
        categories: { create: true, read: true, update: true, delete: true },
        blogs: { create: true, read: true, update: true, delete: true },
        roles: { create: false, read: true, update: false, delete: false },
        settings: { create: false, read: true, update: true, delete: false }
      }
    });
    console.log('✅ Created Admin role');

    // Create User Role
    const userRole = await Role.create({
      name: 'user',
      displayName: 'User',
      description: 'Regular user access',
      permissions: {
        products: { create: false, read: true, update: false, delete: false },
        users: { create: false, read: false, update: false, delete: false },
        orders: { create: true, read: true, update: false, delete: false },
        categories: { create: false, read: true, update: false, delete: false },
        blogs: { create: false, read: true, update: false, delete: false },
        roles: { create: false, read: false, update: false, delete: false },
        settings: { create: false, read: false, update: false, delete: false }
      }
    });
    console.log('✅ Created User role');

    // Create Super Admin User
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@vintagecoin.com',
      password: 'Admin@123',
      role: superAdminRole._id,
      legacyRole: 'superadmin',
      isEmailVerified: true
    });

    console.log('\n🎉 Setup Complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email: admin@vintagecoin.com');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role: Super Admin');
    console.log('═══════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

setupAdmin();
