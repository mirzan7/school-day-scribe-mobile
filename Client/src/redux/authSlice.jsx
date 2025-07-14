// redux/authSlice.jsx
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      const { accessToken, refreshToken, user } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.user = user;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    updateAccessToken(state, action) {
      state.accessToken = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      localStorage.clear();
    },
    passwordChanged(state) {
      if (state.user) {
        // Create a new user object with the updated flag
        const updatedUser = { ...state.user, must_change_password: false };
        
        // Update the state
        state.user = updatedUser;
        
        // Persist the change to localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    },
  },
});

export const { loginSuccess, updateAccessToken, logout, passwordChanged } = authSlice.actions;
export default authSlice.reducer;