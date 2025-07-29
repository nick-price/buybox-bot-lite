import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000'),
  timeout: 10000,
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  try {
    // Get auth instance only when needed
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Also add user ID header for compatibility
    if (user) {
      config.headers['x-user-id'] = user.uid;
    }
    
    console.log('🌐 Axios request:', config.method?.toUpperCase(), config.url);
    console.log('📋 Axios headers:', config.headers);
    
    return config;
  } catch (error) {
    console.error('❌ Axios error:', error);
    return config;
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Axios response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Axios error:', error.response?.status, error.config?.url);
    console.error('❌ Error details:', error.response?.data);
    return Promise.reject(error);
  }
);

export default api; 