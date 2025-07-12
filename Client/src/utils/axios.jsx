// utils/axios.js
import axios from 'axios';
import { store } from '../redux/store';
import { updateAccessToken, logout } from '../redux/authSlice';

const baseURL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    if (state.auth.accessToken) {
      config.headers.Authorization = `Bearer ${state.auth.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { refreshToken } = store.getState().auth;

    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${baseURL}/refresh/`, { refresh: refreshToken });
        const newAccess = res.data.access;
        store.dispatch(updateAccessToken(newAccess));
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(logout());
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { baseURL };