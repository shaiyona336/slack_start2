import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  // Connect to the WebSocket server
  connect(token) {
    if (this.socket && this.socket.connected) {
      return;
    }

    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    this.socket = io(BASE_URL, {
      auth: {
        token
      },
      query: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Setup default event handlers
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Disconnected from WebSocket server: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  // Disconnect from the WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a specific channel room
  joinChannel(channelId) {
    if (this.socket && this.socket.connected) {
      const token = localStorage.getItem('token');
      this.socket.emit('join_channel', { channel_id: channelId, token });
    }
  }

  // Leave a specific channel room
  leaveChannel(channelId) {
    if (this.socket && this.socket.connected) {
      const token = localStorage.getItem('token');
      this.socket.emit('leave_channel', { channel_id: channelId, token });
    }
  }

  // Send a typing indicator in channel
  sendTypingChannel(channelId) {
    if (this.socket && this.socket.connected) {
      const token = localStorage.getItem('token');
      this.socket.emit('typing_channel', { channel_id: channelId, token });
    }
  }

  // Send a stopped typing indicator in channel
  sendStoppedTypingChannel(channelId) {
    if (this.socket && this.socket.connected) {
      const token = localStorage.getItem('token');
      this.socket.emit('stopped_typing_channel', { channel_id: channelId, token });
    }
  }

  // Send a typing indicator in direct message
  sendTypingDirect(chatId) {
    if (this.socket && this.socket.connected) {
      const token = localStorage.getItem('token');
      this.socket.emit('typing_direct', { chat_id: chatId, token });
    }
  }

  // Send a stopped typing indicator in direct message
  sendStoppedTypingDirect(chatId) {
    if (this.socket && this.socket.connected) {
      const token = localStorage.getItem('token');
      this.socket.emit('stopped_typing_direct', { chat_id: chatId, token });
    }
  }

  // Register an event listener
  on(event, callback) {
    if (this.socket) {
      // Store the callback in our listeners object
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);

      // Register with Socket.IO
      this.socket.on(event, callback);
    }
  }

  // Remove an event listener
  off(event, callback) {
    if (this.socket) {
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
  }

  // Get the socket instance
  getSocket() {
    return this.socket;
  }

  // Check if socket is connected
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;