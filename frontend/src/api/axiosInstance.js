import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  timeout: 10000, // 10s timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle connection & server status issues gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network Error (Server is stopped or unreachable)
      error.message = 'Unable to connect to backend server. Please make sure docker containers are running (docker-compose up).';
    }
    return Promise.reject(error);
  }
);

export default api;
