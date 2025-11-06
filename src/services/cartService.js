import api from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';

// Cart Service
export const cartService = {
  // Get user cart
  getCart: async () => {
    const response = await api.get(API_ENDPOINTS.CART);
    return response;
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post(API_ENDPOINTS.CART, { productId, quantity });
    return response;
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(API_ENDPOINTS.CART_ITEM(itemId), { quantity });
    return response;
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    const response = await api.delete(API_ENDPOINTS.CART_ITEM(itemId));
    return response;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete(API_ENDPOINTS.CART);
    return response;
  }
};

export default cartService;
