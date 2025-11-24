import api from '../utils/api';

const paymentService = {
  // Get Razorpay Key ID
  getRazorpayKey: async () => {
    try {
      const response = await api.get('/payments/razorpay-key');
      return response; // Axios interceptor already returns response.data
    } catch (error) {
      throw error;
    }
  },

  // Create Razorpay Order
  createRazorpayOrder: async (amount, currency = 'INR') => {
    try {
      const response = await api.post('/payments/create-order', {
        amount,
        currency,
        receipt: `order_${Date.now()}`
      });
      return response; // Axios interceptor already returns response.data
    } catch (error) {
      throw error;
    }
  },

  // Verify Razorpay Payment
  verifyPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/verify-payment', paymentData);
      return response; // Axios interceptor already returns response.data
    } catch (error) {
      throw error;
    }
  },

  // Handle Payment Failure
  handlePaymentFailure: async (orderId, error) => {
    try {
      const response = await api.post('/payments/payment-failed', {
        orderId,
        error
      });
      return response; // Axios interceptor already returns response.data
    } catch (error) {
      throw error;
    }
  }
};

export default paymentService;
