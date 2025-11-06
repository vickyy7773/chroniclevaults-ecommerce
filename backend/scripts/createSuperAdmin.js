import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Role from './models/Role.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get super admin details from user
    console.log('🔐 Create Super Admin Account\n');

    const name = await question('Enter name: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password: ');

    if (!name || !email || !password) {
      console.log('❌ All fields are required!');
      rl.close();
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('\n⚠️  User with this email already exists!');

      const updateConfirm = await question('Do you want to update this user to super admin? (yes/no): ');

      if (updateConfirm.toLowerCase() === 'yes' || updateConfirm.toLowerCase() === 'y') {
        existingUser.legacyRole = 'superadmin';
        existingUser.isEmailVerified = true;
        await existingUser.save();

        console.log('\n✅ User updated to super admin successfully!');
        console.log('\nSuper Admin Details:');
        console.log(`  Name: ${existingUser.name}`);
        console.log(`  Email: ${existingUser.email}`);
        console.log(`  Role: ${existingUser.legacyRole}`);
      } else {
        console.log('\n❌ Operation cancelled');
      }

      rl.close();
      process.exit(0);
    }

    // Get superadmin role (optional)
    const superAdminRole = await Role.findOne({ name: 'superadmin' });

    // Create super admin user
    const superAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: superAdminRole ? superAdminRole._id : null,
      legacyRole: 'superadmin',
      isEmailVerified: true
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('\nSuper Admin Details:');
    console.log(`  Name: ${superAdmin.name}`);
    console.log(`  Email: ${superAdmin.email}`);
    console.log(`  Role: ${superAdmin.legacyRole}`);
    console.log('\n🎉 You can now login with these credentials!');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    rl.close();
    process.exit(1);
  }
};

createSuperAdmin();
