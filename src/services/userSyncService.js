import api from '../utils/api';

const userSyncService = {
  // Sync cart and wishlist from localStorage to backend
  async syncCartAndWishlist(cart, wishlist) {
    try {
      const response = await api.post('/user/sync', {
        cart: cart.map(item => ({
          product: item._id,
          quantity: item.quantity || 1
        })),
        wishlist: wishlist.map(item => item._id || item)
      });
      return response.data;
    } catch (error) {
      console.error('Error syncing cart/wishlist:', error);
      throw error;
    }
  },

  // Get cart from backend
  async getCart() {
    try {
      const response = await api.get('/user/cart');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  // Add item to cart on backend
  async addToCart(productId, quantity = 1) {
    try {
      const response = await api.post('/user/cart', { productId, quantity });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Update cart item quantity on backend
  async updateCartItem(productId, quantity) {
    try {
      const response = await api.put(`/user/cart/${productId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  // Remove item from cart on backend
  async removeFromCart(productId) {
    try {
      const response = await api.delete(`/user/cart/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Clear cart on backend
  async clearCart() {
    try {
      const response = await api.delete('/user/cart');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Get wishlist from backend
  async getWishlist() {
    try {
      const response = await api.get('/user/wishlist');
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  },

  // Add item to wishlist on backend
  async addToWishlist(productId) {
    try {
      const response = await api.post(`/user/wishlist/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  // Remove item from wishlist on backend
  async removeFromWishlist(productId) {
    try {
      const response = await api.delete(`/user/wishlist/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }
};

export default userSyncService;
