import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connectAttempts = 0;
  }

  // Connect to the WebSocket server
  connect(token) {
    // Don't try to reconnect if already connected
    if (this.socket && this.socket.connected) {
      console.log("Socket already connected, skipping connection");
      return;
    }

    this.connectAttempts++;
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    // Remove /api if it's at the end of the URL
    const socketUrl = backendUrl.replace(/\/api$/, '');
    
    console.log(`Connecting to Socket.IO server (attempt ${this.connectAttempts}):`, socketUrl);

    try {
      this.socket = io(socketUrl, {
        auth: { token },
        query: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Successfully connected to Socket.IO server');
        this.connectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        
        // If we've tried too many times, log additional advice
        if (this.connectAttempts >= 3) {
          console.error(`
            Multiple connection attempts failed. Possible issues:
            1. Backend server might not be running
            2. CORS might be blocking the connection
            3. Network issues between frontend and backend
            
            Check your browser console network tab for more details.
          `);
        }
      });
    } catch (error) {
      console.error('Error creating socket connection:', error);
    }
  }

  // Disconnect from the WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Socket disconnected");
    }
  }

  // Join a specific channel room
  joinChannel(channelId) {
    if (!this.socket) {
      console.error("Socket not initialized, cannot join channel");
      return;
    }
    
    if (!this.socket.connected) {
      console.error("Socket not connected, cannot join channel");
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      this.socket.emit('join_channel', { channel_id: channelId, token });
      console.log(`Joined channel: ${channelId}`);
    } catch (error) {
      console.error(`Error joining channel ${channelId}:`, error);
    }
  }

  // Other methods remain largely the same, but with better error handling
  leaveChannel(channelId) {
    if (!this.socket || !this.socket.connected) return;
    
    try {
      const token = localStorage.getItem('token');
      this.socket.emit('leave_channel', { channel_id: channelId, token });
    } catch (error) {
      console.error(`Error leaving channel ${channelId}:`, error);
    }
  }

  sendTypingChannel(channelId) {
    if (!this.socket || !this.socket.connected) return;
    
    try {
      const token = localStorage.getItem('token');
      this.socket.emit('typing_channel', { channel_id: channelId, token });
    } catch (error) {
      console.error(`Error sending typing indicator for channel ${channelId}:`, error);
    }
  }

  sendStoppedTypingChannel(channelId) {
    if (!this.socket || !this.socket.connected) return;
    
    try {
      const token = localStorage.getItem('token');
      this.socket.emit('stopped_typing_channel', { channel_id: channelId, token });
    } catch (error) {
      console.error(`Error sending stopped typing indicator for channel ${channelId}:`, error);
    }
  }

  sendTypingDirect(chatId) {
    if (!this.socket || !this.socket.connected) return;
    
    try {
      const token = localStorage.getItem('token');
      this.socket.emit('typing_direct', { chat_id: chatId, token });
    } catch (error) {
      console.error(`Error sending typing indicator for chat ${chatId}:`, error);
    }
  }

  sendStoppedTypingDirect(chatId) {
    if (!this.socket || !this.socket.connected) return;
    
    try {
      const token = localStorage.getItem('token');
      this.socket.emit('stopped_typing_direct', { chat_id: chatId, token });
    } catch (error) {
      console.error(`Error sending stopped typing indicator for chat ${chatId}:`, error);
    }
  }

  on(event, callback) {
    if (!this.socket) {
      console.error(`Cannot register event '${event}', socket not initialized`);
      return;
    }
    
    // Store the callback in our listeners object
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Register with Socket.IO
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    
    // Remove the callback from our listeners object
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    // Remove from Socket.IO
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;