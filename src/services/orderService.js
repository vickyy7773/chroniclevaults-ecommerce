import api from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';

// Order Service
export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post(API_ENDPOINTS.ORDERS, orderData);
    return response;
  },

  // Get user orders
  getMyOrders: async () => {
    const response = await api.get(API_ENDPOINTS.MY_ORDERS);
    return response;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(API_ENDPOINTS.ORDER_BY_ID(id));
    return response;
  },

  // Update order to paid
  updateOrderToPaid: async (id, paymentResult) => {
    const response = await api.put(API_ENDPOINTS.ORDER_PAY(id), paymentResult);
    return response;
  },

  // Update order status (Admin only)
  updateOrderStatus: async (id, orderStatus) => {
    const response = await api.put(API_ENDPOINTS.ORDER_STATUS(id), { orderStatus });
    return response;
  },

  // Update order tracking info (Admin only)
  updateOrderTracking: async (id, trackingData) => {
    const response = await api.put(API_ENDPOINTS.ORDER_TRACKING(id), trackingData);
    return response;
  },

  // Get all orders (Admin only)
  getAllOrders: async () => {
    const response = await api.get(API_ENDPOINTS.ORDERS);
    return response;
  }
};

export default orderService;
