// utils/axios.js
import axios from 'axios';

const baseURL = 'http://localhost:8000/api'; // or your actual base URL

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refreshToken')
    ) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${baseURL}/token/refresh/`, {
          refresh: localStorage.getItem('refreshToken'),
        });

        localStorage.setItem('accessToken', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/'; // logout on token expiry
      }
    }
    return Promise.reject(err);
  }
);

export default api;
