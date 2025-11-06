import api from '../utils/api';

export const sliderService = {
  // Get all active sliders (public)
  getAllSliders: async () => {
    try {
      const response = await api.get('/sliders');
      return response;
    } catch (error) {
      console.error('Error fetching sliders:', error);
      throw error;
    }
  },

  // Get all sliders including inactive (admin)
  getAllSlidersAdmin: async () => {
    try {
      const response = await api.get('/sliders/admin/all');
      return response;
    } catch (error) {
      console.error('Error fetching admin sliders:', error);
      throw error;
    }
  },

  // Get single slider by ID
  getSliderById: async (id) => {
    try {
      const response = await api.get(`/sliders/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching slider:', error);
      throw error;
    }
  },

  // Create new slider
  createSlider: async (sliderData) => {
    try {
      const response = await api.post('/sliders', sliderData);
      return response;
    } catch (error) {
      console.error('Error creating slider:', error);
      throw error;
    }
  },

  // Update slider
  updateSlider: async (id, sliderData) => {
    try {
      const response = await api.put(`/sliders/${id}`, sliderData);
      return response;
    } catch (error) {
      console.error('Error updating slider:', error);
      throw error;
    }
  },

  // Delete slider
  deleteSlider: async (id) => {
    try {
      const response = await api.delete(`/sliders/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting slider:', error);
      throw error;
    }
  },

  // Reorder sliders
  reorderSliders: async (sliders) => {
    try {
      const response = await api.put('/sliders/reorder', { sliders });
      return response;
    } catch (error) {
      console.error('Error reordering sliders:', error);
      throw error;
    }
  }
};

export default sliderService;
