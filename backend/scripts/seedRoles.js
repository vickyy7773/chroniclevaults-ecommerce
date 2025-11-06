import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './models/Role.js';
import User from './models/User.js';

dotenv.config();

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing roles (optional - comment out if you want to keep existing roles)
    // await Role.deleteMany({});
    // console.log('🗑️  Cleared existing roles');

    // Define default roles
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
        description: 'Administrative access with most permissions',
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
        name: 'manager',
        displayName: 'Manager',
        description: 'Manager role with limited permissions',
        permissions: {
          users: { view: true, create: false, edit: false, delete: false },
          products: { view: true, create: true, edit: true, delete: false },
          orders: { view: true, edit: true, delete: false },
          categories: { view: true, create: true, edit: true, delete: false },
          blogs: { view: true, create: true, edit: true, delete: false },
          roles: { view: false, create: false, edit: false, delete: false },
          admins: { create: false, edit: false, delete: false },
          dashboard: { access: true }
        },
        isSystemRole: false
      },
      {
        name: 'user',
        displayName: 'User',
        description: 'Regular user with basic permissions',
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

    // Create or update roles
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });

      if (existingRole) {
        console.log(`⚠️  Role '${roleData.name}' already exists, skipping...`);
      } else {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.displayName}`);
      }
    }

    console.log('\n🎉 Roles seeded successfully!');
    console.log('\nAvailable roles:');
    const roles = await Role.find();
    roles.forEach(role => {
      console.log(`  - ${role.displayName} (${role.name})`);
    });

    console.log('\n📝 Next steps:');
    console.log('1. Create a super admin user using the createSuperAdmin.js script');
    console.log('2. Login as super admin');
    console.log('3. Use the admin panel to create more admins and manage roles');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
