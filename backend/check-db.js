import mongoose from 'mongoose';

const checkDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chroniclevaults');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Count products
    const productsCount = await db.collection('products').countDocuments();
    console.log(`\n📦 Total Products: ${productsCount}`);

    // Get 3 sample products
    const products = await db.collection('products').find({}).limit(3).toArray();

    console.log('\n📋 Sample Products:');
    products.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   Code: ${p.productCode}`);
      console.log(`   Price: ${p.price}`);
      console.log(`   Images: ${p.images ? p.images[0] : 'No image'}`);
    });

    // Count users
    const usersCount = await db.collection('users').countDocuments();
    console.log(`\n👥 Total Users: ${usersCount}`);

    // Get users
    const users = await db.collection('users').find({}, { projection: { email: 1, name: 1, legacyRole: 1 }}).toArray();
    console.log('\n👤 Users:');
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - Role: ${u.legacyRole || 'N/A'}`);
    });

    // Check which database we're connected to
    console.log(`\n🗄️  Database Name: ${db.databaseName}`);
    console.log(`📍 Connection String: mongodb://127.0.0.1:27017/${db.databaseName}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDB();
