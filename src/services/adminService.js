import api from '../utils/api';

export const adminService = {
  // Create new admin user
  createAdmin: async (adminData) => {
    try {
      console.log('👤 Creating admin with data:', adminData);
      const response = await api.post('/admin/create-admin', adminData);
      console.log('✅ Admin created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating admin:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Get all admin users
  getAllAdmins: async () => {
    try {
      console.log('👥 Fetching all admins...');
      const response = await api.get('/admin/admins');
      console.log('✅ Admins fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching admins:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Update admin user
  updateAdmin: async (id, adminData) => {
    try {
      const response = await api.put(`/admin/admins/${id}`, adminData);
      return response;
    } catch (error) {
      console.error('Error updating admin:', error);
      throw error;
    }
  },

  // Delete admin user
  deleteAdmin: async (id) => {
    try {
      const response = await api.delete(`/admin/admins/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting admin:', error);
      throw error;
    }
  },

  // Assign role to user
  assignRoleToUser: async (userId, roleId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/assign-role`, { roleId });
      return response;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  // Get user permissions
  getUserPermissions: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/permissions`);
      return response;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }
};

export default adminService;
