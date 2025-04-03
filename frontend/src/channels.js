import api from './api';

const ChannelsAPI = {
  // Get all channels for the user
  getUserChannels: async () => {
    try {
      const response = await api.get('/channels');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get channels' };
    }
  },

  // Get a specific channel by ID
  getChannel: async (channelId) => {
    try {
      const response = await api.get(`/channels/${channelId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get channel' };
    }
  },

  // Create a new channel
  createChannel: async (channelData) => {
    try {
      const response = await api.post('/channels', channelData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create channel' };
    }
  },

  // Add a user to a channel
  addChannelMember: async (channelId, userId) => {
    try {
      const response = await api.post(`/channels/${channelId}/members`, { user_id: userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to add member to channel' };
    }
  },

  // Get all direct messages for the user
  getUserDirectMessages: async () => {
    try {
      const response = await api.get('/channels/direct-messages');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get direct messages' };
    }
  },

  // Create a new direct message chat
  createDirectMessage: async (recipientId) => {
    try {
      const response = await api.post('/channels/direct-messages', { recipient_id: recipientId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to create direct message' };
    }
  }
};

export default ChannelsAPI;