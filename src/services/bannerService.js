import api from '../utils/api';

export const bannerService = {
  // Get active banner (public)
  getActiveBanner: async () => {
    return await api.get('/banners/active');
  },

  // Get all banners (admin)
  getAllBannersAdmin: async () => {
    return await api.get('/banners');
  },

  // Get banner by ID (admin)
  getBannerById: async (id) => {
    return await api.get(`/banners/${id}`);
  },

  // Create banner (admin)
  createBanner: async (bannerData) => {
    return await api.post('/banners', bannerData);
  },

  // Update banner (admin)
  updateBanner: async (id, bannerData) => {
    return await api.put(`/banners/${id}`, bannerData);
  },

  // Delete banner (admin)
  deleteBanner: async (id) => {
    return await api.delete(`/banners/${id}`);
  },

  // Toggle banner active status (admin)
  toggleBannerStatus: async (id) => {
    return await api.put(`/banners/${id}/toggle`);
  }
};

export default bannerService;
