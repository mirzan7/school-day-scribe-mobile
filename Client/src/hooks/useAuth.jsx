// hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { accessToken, refreshToken, user } = useSelector((state) => state.auth);
  
  const isAuthenticated = !!accessToken;
  
  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    isAuthenticated,
    accessToken,
    refreshToken,
    user,
    logout: handleLogout
  };
};