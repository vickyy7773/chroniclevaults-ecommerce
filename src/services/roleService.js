import api from '../utils/api';

export const roleService = {
  // Get all roles
  getAllRoles: async () => {
    try {
      console.log('🔐 Fetching all roles...');
      const response = await api.get('/roles');
      console.log('✅ Roles fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Get single role by ID
  getRoleById: async (id) => {
    try {
      const response = await api.get(`/roles/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  },

  // Create new role
  createRole: async (roleData) => {
    try {
      console.log('🔐 Creating role with data:', roleData);
      const response = await api.post('/roles', roleData);
      console.log('✅ Role created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating role:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Update role
  updateRole: async (id, roleData) => {
    try {
      console.log(`🔐 Updating role ${id} with data:`, roleData);
      const response = await api.put(`/roles/${id}`, roleData);
      console.log('✅ Role updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Error updating role:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Delete role
  deleteRole: async (id) => {
    try {
      console.log(`🔐 Deleting role ${id}`);
      const response = await api.delete(`/roles/${id}`);
      console.log('✅ Role deleted:', response);
      return response;
    } catch (error) {
      console.error('❌ Error deleting role:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Get role permissions
  getRolePermissions: async (id) => {
    try {
      const response = await api.get(`/roles/${id}/permissions`);
      return response;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  }
};

export default roleService;
