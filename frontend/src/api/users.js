import api from './api';

const UsersAPI = {
  // Get all users (with optional search)
  getUsers: async (query = '') => {
    try {
      const response = await api.get('/users', {
        params: { query }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get users' };
    }
  },

  // Get a specific user by ID
  getUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get user' };
    }
  }
};

export default UsersAPI;