import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
  handlePaymentFailure
} from '../controllers/paymentController.js';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/razorpay-key', getRazorpayKey);
router.post('/webhook', handleRazorpayWebhook); // Webhook endpoint

// Protected routes
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);
router.post('/payment-failed', protect, handlePaymentFailure);

export default router;
