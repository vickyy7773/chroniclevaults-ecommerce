import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Check if Razorpay is properly configured
if (process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id_here' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret_here') {
  console.log('✅ Razorpay payment gateway enabled');
} else {
  console.log('⚠️  Razorpay disabled - Add credentials to .env to enable');
}

export default razorpayInstance;
