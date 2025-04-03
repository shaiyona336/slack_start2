import api from './api';

const MessagesAPI = {
  // Get channel messages
  getChannelMessages: async (channelId, page = 1, perPage = 50) => {
    try {
      const response = await api.get(`/messages/channel/${channelId}`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get channel messages' };
    }
  },

  // Send a message to a channel
  sendChannelMessage: async (channelId, content) => {
    try {
      const response = await api.post(`/messages/channel/${channelId}`, { content });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to send message' };
    }
  },

  // Get direct messages
  getDirectMessages: async (chatId, page = 1, perPage = 50) => {
    try {
      const response = await api.get(`/messages/direct/${chatId}`, {
        params: { page, per_page: perPage }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to get direct messages' };
    }
  },

  // Send a direct message
  sendDirectMessage: async (chatId, content) => {
    try {
      const response = await api.post(`/messages/direct/${chatId}`, { content });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to send direct message' };
    }
  },

  // Add a reaction to a message
  addReaction: async (messageId, reaction) => {
    try {
      const response = await api.post(`/messages/${messageId}/reactions`, { reaction });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to add reaction' };
    }
  }
};

export default MessagesAPI;