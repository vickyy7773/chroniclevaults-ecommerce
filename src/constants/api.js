// API Base URL - Production and Development
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://chroniclevaults.com/api'
  : 'http://localhost:5000/api';

// Debug logging
console.log('📡 API Constants Loaded:', {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  API_BASE_URL: API_BASE_URL
});

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  AUTH_UPDATE_PROFILE: '/auth/updateprofile',
  AUTH_UPDATE_PASSWORD: '/auth/updatepassword',

  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  FEATURED_PRODUCTS: '/products/featured',

  // Cart
  CART: '/cart',
  CART_ITEM: (itemId) => `/cart/${itemId}`,

  // Orders
  ORDERS: '/orders',
  MY_ORDERS: '/orders/myorders',
  ORDER_BY_ID: (id) => `/orders/${id}`,
  ORDER_PAY: (id) => `/orders/${id}/pay`,
  ORDER_STATUS: (id) => `/orders/${id}/status`,
  ORDER_TRACKING: (id) => `/orders/${id}/tracking`,

  // Users/Customers
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  USER_STATUS: (id) => `/users/${id}/status`,

  // Health
  HEALTH: '/health'
};
