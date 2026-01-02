import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import User from './models/User.js';
import Product from './models/Product.js';

dotenv.config();

const sampleOrders = [
  {
    orderStatus: 'Delivered',
    paymentMethod: 'Card',
    isPaid: true,
    itemsPrice: 5000,
    taxPrice: 900,
    shippingPrice: 100,
    totalPrice: 6000,
    daysAgo: 5
  },
  {
    orderStatus: 'Delivered',
    paymentMethod: 'COD',
    isPaid: false,
    itemsPrice: 3000,
    taxPrice: 540,
    shippingPrice: 100,
    totalPrice: 3640,
    daysAgo: 10
  },
  {
    orderStatus: 'Delivered',
    paymentMethod: 'UPI',
    isPaid: true,
    itemsPrice: 7500,
    taxPrice: 1350,
    shippingPrice: 150,
    totalPrice: 9000,
    daysAgo: 15
  },
  {
    orderStatus: 'Shipped',
    paymentMethod: 'Card',
    isPaid: true,
    itemsPrice: 4000,
    taxPrice: 720,
    shippingPrice: 100,
    totalPrice: 4820,
    daysAgo: 2
  },
  {
    orderStatus: 'Processing',
    paymentMethod: 'Razorpay',
    isPaid: true,
    itemsPrice: 6000,
    taxPrice: 1080,
    shippingPrice: 100,
    totalPrice: 7180,
    daysAgo: 1
  },
  {
    orderStatus: 'Delivered',
    paymentMethod: 'Card',
    isPaid: true,
    itemsPrice: 8000,
    taxPrice: 1440,
    shippingPrice: 150,
    totalPrice: 9590,
    daysAgo: 20
  },
  {
    orderStatus: 'Delivered',
    paymentMethod: 'UPI',
    isPaid: true,
    itemsPrice: 2500,
    taxPrice: 450,
    shippingPrice: 100,
    totalPrice: 3050,
    daysAgo: 25
  },
  {
    orderStatus: 'Cancelled',
    paymentMethod: 'COD',
    isPaid: false,
    itemsPrice: 1500,
    taxPrice: 270,
    shippingPrice: 100,
    totalPrice: 1870,
    daysAgo: 3
  },
  {
    orderStatus: 'Delivered',
    paymentMethod: 'Card',
    isPaid: true,
    itemsPrice: 12000,
    taxPrice: 2160,
    shippingPrice: 200,
    totalPrice: 14360,
    daysAgo: 12
  },
  {
    orderStatus: 'Delivered',
    paymentMethod: 'UPI',
    isPaid: true,
    itemsPrice: 3500,
    taxPrice: 630,
    shippingPrice: 100,
    totalPrice: 4230,
    daysAgo: 8
  }
];

const seedEcommerceData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Get first user and first product
    const user = await User.findOne({ legacyRole: 'user' });
    const products = await Product.find().limit(5);

    if (!user) {
      console.error('❌ No user found. Please create a user first.');
      process.exit(1);
    }

    if (products.length === 0) {
      console.error('❌ No products found. Please create products first.');
      process.exit(1);
    }

    console.log(`👤 Using user: ${user.email}`);
    console.log(`📦 Found ${products.length} products`);

    // ⚠️ WARNING: NEVER run this on production!
    // Uncomment ONLY for development/testing
    // console.log('🗑️  Clearing existing orders...');
    // await Order.deleteMany({});

    // Create sample orders
    console.log('📝 Creating sample orders...');

    for (let i = 0; i < sampleOrders.length; i++) {
      const orderData = sampleOrders[i];
      const product = products[i % products.length];

      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - orderData.daysAgo);

      const order = await Order.create({
        user: user._id,
        orderItems: [
          {
            product: product._id,
            name: product.name,
            quantity: Math.floor(Math.random() * 3) + 1,
            image: product.images[0] || '',
            price: product.price,
            gst: product.gst || 18,
            hsnCode: product.hsnCode || '97050090',
            description: product.description
          }
        ],
        shippingAddress: {
          street: '123 Sample Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        paymentMethod: orderData.paymentMethod,
        paymentResult: orderData.isPaid ? {
          id: `PAY${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: 'completed',
          updateTime: orderDate.toISOString()
        } : undefined,
        itemsPrice: orderData.itemsPrice,
        taxPrice: orderData.taxPrice,
        shippingPrice: orderData.shippingPrice,
        totalPrice: orderData.totalPrice,
        isPaid: orderData.isPaid,
        paidAt: orderData.isPaid ? orderDate : undefined,
        isDelivered: orderData.orderStatus === 'Delivered',
        deliveredAt: orderData.orderStatus === 'Delivered' ? orderDate : undefined,
        orderStatus: orderData.orderStatus,
        statusHistory: [
          {
            status: 'Order Placed',
            timestamp: orderDate,
            note: 'Order has been placed successfully'
          }
        ],
        createdAt: orderDate,
        updatedAt: orderDate
      });

      console.log(`✅ Created order ${i + 1}: ${order._id} - ${orderData.orderStatus} - ₹${orderData.totalPrice}`);
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log(`📊 Total orders created: ${sampleOrders.length}`);
    console.log('\n💡 Now you can view reports in the admin panel!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedEcommerceData();
