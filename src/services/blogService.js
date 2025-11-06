import api from '../utils/api';

const blogService = {
  // Get all blogs
  getAllBlogs: async () => {
    try {
      const response = await api.get('/blogs');
      return response; // Return full response object
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  },

  // Get published blogs for frontend
  getPublishedBlogs: async () => {
    try {
      const response = await api.get('/blogs/published');
      return response; // Return full response object
    } catch (error) {
      console.error('Error fetching published blogs:', error);
      throw error;
    }
  },

  // Get single blog by ID
  getBlogById: async (id) => {
    try {
      const response = await api.get(`/blogs/${id}`);
      return response; // Return full response object
    } catch (error) {
      console.error('Error fetching blog:', error);
      throw error;
    }
  },

  // Create new blog
  createBlog: async (blogData) => {
    try {
      const response = await api.post('/blogs', blogData);
      return response; // Return full response object
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  },

  // Update blog
  updateBlog: async (id, blogData) => {
    try {
      const response = await api.put(`/blogs/${id}`, blogData);
      return response; // Return full response object
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  },

  // Delete blog
  deleteBlog: async (id) => {
    try {
      const response = await api.delete(`/blogs/${id}`);
      return response; // Return full response object
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  },

  // Upload blog image
  uploadBlogImage: async (formData) => {
    try {
      const response = await api.post('/blogs/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response; // Return full response object
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
};

export default blogService;
