import crypto from 'crypto';
import Order from '../models/Order.js';

// @desc    Handle Razorpay Webhook
// @route   POST /api/payments/webhook
// @access  Public (but verified)
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookSignature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generatedSignature !== webhookSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`📨 Webhook received: ${event}`);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
      case 'order.paid':
        await handlePaymentSuccess(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// Handle successful payment
const handlePaymentSuccess = async (payload) => {
  try {
    const paymentEntity = payload.payment?.entity || payload.order?.entity;
    const razorpayOrderId = paymentEntity.order_id;

    // Find order by razorpay order ID
    const order = await Order.findOne({
      'paymentResult.razorpay_order_id': razorpayOrderId
    });

    if (!order) {
      console.log('Order not found for webhook:', razorpayOrderId);
      return;
    }

    // Update order if not already paid
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult.status = 'success';

      order.statusHistory.push({
        status: 'Payment Confirmed (Webhook)',
        timestamp: new Date(),
        note: 'Payment confirmed via webhook'
      });

      await order.save();
      console.log('✅ Order updated via webhook:', order._id);
    }
  } catch (error) {
    console.error('Error handling payment success webhook:', error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (payload) => {
  try {
    const paymentEntity = payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;

    const order = await Order.findOne({
      'paymentResult.razorpay_order_id': razorpayOrderId
    });

    if (!order) {
      console.log('Order not found for failed payment webhook');
      return;
    }

    order.paymentResult.status = 'failed';
    order.statusHistory.push({
      status: 'Payment Failed (Webhook)',
      timestamp: new Date(),
      note: `Payment failed: ${paymentEntity.error_description || 'Unknown error'}`
    });

    await order.save();
    console.log('❌ Payment failure recorded via webhook:', order._id);
  } catch (error) {
    console.error('Error handling payment failed webhook:', error);
  }
};
