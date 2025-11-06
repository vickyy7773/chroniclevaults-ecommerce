import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const activityService = {
  // Get all admin activities
  getAllActivities: async (params = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/admin/activities?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get specific admin activities
  getAdminActivities: async (adminId, params = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/admin/activities/admin/${adminId}?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get admin login/logout sessions
  getAdminSessions: async (adminId, params = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/admin/activities/sessions/${adminId}?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get activity statistics
  getActivityStats: async (params = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/admin/activities/stats?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get activity timeline
  getActivityTimeline: async (days = 7) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/activities/timeline?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Logout with activity tracking
  logout: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default activityService;
