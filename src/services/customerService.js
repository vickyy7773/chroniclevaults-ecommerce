import api from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';

// Customer/User Service
export const customerService = {
  // Get all customers
  getAllCustomers: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USERS);
      return response;
    } catch (error) {
      console.error('Get all customers error:', error);
      throw error;
    }
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER_BY_ID(customerId));
      return response;
    } catch (error) {
      console.error('Get customer by ID error:', error);
      throw error;
    }
  },

  // Update customer status
  updateCustomerStatus: async (customerId, status) => {
    try {
      const response = await api.put(API_ENDPOINTS.USER_STATUS(customerId), { status });
      return response;
    } catch (error) {
      console.error('Update customer status error:', error);
      throw error;
    }
  },

  // Update customer details
  updateCustomer: async (customerId, customerData) => {
    try {
      const response = await api.put(API_ENDPOINTS.USER_BY_ID(customerId), customerData);
      return response;
    } catch (error) {
      console.error('Update customer error:', error);
      throw error;
    }
  },

  // Delete customer
  deleteCustomer: async (customerId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.USER_BY_ID(customerId));
      return response;
    } catch (error) {
      console.error('Delete customer error:', error);
      throw error;
    }
  }
};

export default customerService;
