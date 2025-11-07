import Razorpay from 'razorpay';

let razorpayInstance = null;

// Initialize Razorpay instance only if credentials are provided
if (process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id_here' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret_here') {

  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay payment gateway enabled');
  } catch (error) {
    console.error('❌ Razorpay initialization error:', error.message);
  }
} else {
  console.log('⚠️  Razorpay disabled - Add credentials to .env to enable');
}

export default razorpayInstance;
