import api from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';

// Product Service
export const productService = {
  // Get all products with filters
  getAllProducts: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `${API_ENDPOINTS.PRODUCTS}?${queryParams}` : API_ENDPOINTS.PRODUCTS;

    const response = await api.get(endpoint);
    return response;
  },

  // Get single product
  getProductById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_BY_ID(id));
    return response;
  },

  // Get featured products
  getFeaturedProducts: async () => {
    const response = await api.get(API_ENDPOINTS.FEATURED_PRODUCTS);
    return response;
  },

  // Create product (Admin only)
  createProduct: async (productData) => {
    try {
      console.log('📦 Creating product with data:', productData);
      const response = await api.post(API_ENDPOINTS.PRODUCTS, productData);
      console.log('✅ Product created:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Update product (Admin only)
  updateProduct: async (id, productData) => {
    try {
      console.log('📝 Updating product:', id, productData);
      const response = await api.put(API_ENDPOINTS.PRODUCT_BY_ID(id), productData);
      console.log('✅ Product updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Error updating product:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Delete product (Admin only)
  deleteProduct: async (id) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCT_BY_ID(id));
    return response;
  }
};

export default productService;
