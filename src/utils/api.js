import axios from 'axios';

// Get API URL - HARD-CODED TO FIX PORT ISSUE
const API_URL = 'http://localhost:5000/api';
console.log('🔧 API Configuration:', {
  VITE_API_URL: 'HARD-CODED',
  API_URL: API_URL,
  MODE: import.meta.env.MODE
});

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies
});

// Add request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/auth/register', userData),

  // Login user
  login: (credentials) => api.post('/auth/login', credentials),

  // Get current user
  getMe: () => api.get('/auth/me'),

  // Update profile
  updateProfile: (data) => api.put('/auth/updateprofile', data),

  // Update password
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

// ==================== PRODUCT APIs ====================
export const productAPI = {
  // Get all products
  getAll: (params) => api.get('/products', { params }),

  // Get single product
  getById: (id) => api.get(`/products/${id}`),

  // Create product (admin)
  create: (productData) => api.post('/products', productData),

  // Update product (admin)
  update: (id, productData) => api.put(`/products/${id}`, productData),

  // Delete product (admin)
  delete: (id) => api.delete(`/products/${id}`),

  // Get featured products
  getFeatured: () => api.get('/products/featured'),

  // Search products
  search: (query) => api.get('/products/search', { params: { q: query } }),
};

// ==================== CART APIs ====================
export const cartAPI = {
  // Get user cart
  get: () => api.get('/cart'),

  // Add item to cart
  addItem: (productId, quantity) => api.post('/cart/add', { productId, quantity }),

  // Update cart item
  updateItem: (productId, quantity) => api.put('/cart/update', { productId, quantity }),

  // Remove item from cart
  removeItem: (productId) => api.delete(`/cart/remove/${productId}`),

  // Clear cart
  clear: () => api.delete('/cart/clear'),
};

// ==================== ORDER APIs ====================
export const orderAPI = {
  // Get all orders (user)
  getMyOrders: () => api.get('/orders/myorders'),

  // Get single order
  getById: (id) => api.get(`/orders/${id}`),

  // Create order
  create: (orderData) => api.post('/orders', orderData),

  // Update order status (admin)
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),

  // Get all orders (admin)
  getAll: (params) => api.get('/orders/admin/all', { params }),
};

// ==================== CATEGORY/PAGE POSTER APIs ====================
export const categoryAPI = {
  // Get all categories
  getAll: () => api.get('/page-posters'),

  // Get category by ID
  getById: (id) => api.get(`/page-posters/${id}`),

  // Create category (admin)
  create: (categoryData) => api.post('/page-posters', categoryData),

  // Update category (admin)
  update: (id, categoryData) => api.put(`/page-posters/${id}`, categoryData),

  // Delete category (admin)
  delete: (id) => api.delete(`/page-posters/${id}`),

  // Add slider to category
  addSlider: (categoryId, sliderData) => api.post(`/page-posters/${categoryId}/sliders`, sliderData),

  // Delete slider
  deleteSlider: (categoryId, sliderId) => api.delete(`/page-posters/${categoryId}/sliders/${sliderId}`),

  // Add subcategory
  addSubcategory: (categoryId, subcategoryData) => api.post(`/page-posters/${categoryId}/subcategories`, subcategoryData),

  // Delete subcategory
  deleteSubcategory: (categoryId, subcategoryId) => api.delete(`/page-posters/${categoryId}/subcategories/${subcategoryId}`),
};

// ==================== UPLOAD APIs ====================
export const uploadAPI = {
  // Upload single image
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload multiple images
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// ==================== ADMIN/CUSTOMER APIs ====================
export const customerAPI = {
  // Get all customers (admin)
  getAll: (params) => api.get('/admin/customers', { params }),

  // Get customer by ID (admin)
  getById: (id) => api.get(`/admin/customers/${id}`),

  // Update customer status (admin)
  updateStatus: (id, status) => api.put(`/admin/customers/${id}/status`, { status }),

  // Delete customer (admin)
  delete: (id) => api.delete(`/admin/customers/${id}`),
};

// ==================== REVIEW APIs ====================
export const reviewAPI = {
  // Get product reviews
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews`),

  // Add review
  addReview: (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData),

  // Get all reviews (admin)
  getAll: (params) => api.get('/admin/reviews', { params }),

  // Update review status (admin)
  updateStatus: (reviewId, status) => api.put(`/admin/reviews/${reviewId}/status`, { status }),

  // Delete review (admin)
  delete: (reviewId) => api.delete(`/admin/reviews/${reviewId}`),
};

// ==================== BLOG APIs ====================
export const blogAPI = {
  // Get all blog posts
  getAll: (params) => api.get('/blogs', { params }),

  // Get blog post by ID
  getById: (id) => api.get(`/blogs/${id}`),

  // Create blog post (admin)
  create: (blogData) => api.post('/blogs', blogData),

  // Update blog post (admin)
  update: (id, blogData) => api.put(`/blogs/${id}`, blogData),

  // Delete blog post (admin)
  delete: (id) => api.delete(`/blogs/${id}`),
};

// ==================== DASHBOARD/STATS APIs ====================
export const dashboardAPI = {
  // Get admin dashboard stats
  getStats: () => api.get('/admin/dashboard/stats'),

  // Get sales chart data
  getSalesData: (period) => api.get('/admin/dashboard/sales', { params: { period } }),

  // Get recent orders
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),

  // Get top products
  getTopProducts: () => api.get('/admin/dashboard/top-products'),
};

export default api;
