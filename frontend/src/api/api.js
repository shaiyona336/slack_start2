import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Base URL:', BASE_URL);

// Create a simple axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log("Sending request to:", config.url);
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error("API Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
          },
        });

        if (response.data.success) {
          localStorage.setItem('token', response.data.access_token);
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`;
          return api(originalRequest);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;