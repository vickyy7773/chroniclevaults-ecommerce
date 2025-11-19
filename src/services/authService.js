import api from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';

// Auth Service
export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.AUTH_REGISTER, userData);

    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.AUTH_LOGIN, credentials);

    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response;
  },

  // Logout user
  logout: async () => {
    try {
      // Call logout endpoint to log activity for admins
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API fails
    } finally {
      // Clear all localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('wishlist');

      // Clear all sessionStorage
      sessionStorage.clear();

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH_ME);
      return response; // Response interceptor already returns response.data
    } catch (error) {
      // Don't auto-logout - let the caller decide what to do with the error
      // Only logout on 401 (handled in App.jsx)
      throw error;
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put(API_ENDPOINTS.AUTH_UPDATE_PROFILE, userData);

    if (response.success) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.data }));
    }

    return response;
  },

  // Update password
  updatePassword: async (passwords) => {
    const response = await api.put(API_ENDPOINTS.AUTH_UPDATE_PASSWORD, passwords);

    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }

    return response;
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored user data
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Address management
  getAddresses: async () => {
    return await api.get('/users/me/addresses');
  },

  addAddress: async (addressData) => {
    return await api.post('/users/me/addresses', addressData);
  },

  updateAddress: async (addressId, addressData) => {
    return await api.put(`/users/me/addresses/${addressId}`, addressData);
  },

  deleteAddress: async (addressId) => {
    return await api.delete(`/users/me/addresses/${addressId}`);
  },

  setDefaultAddress: async (addressId) => {
    return await api.put(`/users/me/addresses/${addressId}/default`);
  }
};

export default authService;
