import razorpayInstance from '../config/razorpay.js';
import crypto from 'crypto';
import Order from '../models/Order.js';

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in paise (smallest currency unit)
      currency,
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1 // Auto capture payment
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify-payment
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

    // Update order payment status
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: razorpay_payment_id,
      status: 'success',
      razorpay_order_id,
      razorpay_signature
    };

    // Add payment success to status history
    order.statusHistory.push({
      status: 'Payment Confirmed',
      timestamp: new Date(),
      note: 'Payment received and verified successfully'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: order
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// @desc    Get Razorpay Key ID (for frontend)
// @route   GET /api/payments/razorpay-key
// @access  Public
export const getRazorpayKey = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Razorpay key'
    });
  }
};

// @desc    Handle payment failure
// @route   POST /api/payments/payment-failed
// @access  Private
export const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, error } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Add payment failure to status history
    order.statusHistory.push({
      status: 'Payment Failed',
      timestamp: new Date(),
      note: `Payment failed: ${error?.description || 'Unknown error'}`
    });

    order.paymentResult = {
      status: 'failed',
      error: error?.description || 'Payment failed'
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded',
      data: order
    });
  } catch (error) {
    console.error('Payment Failure Handler Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment failure'
    });
  }
};
