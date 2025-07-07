import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    if (token) {
      setTimeout(() => {
        setUser({
          id: '1',
          name: userRole === 'principal' ? 'Dr. Sarah Principal' : 'John Teacher',
          email: userRole === 'principal' ? 'principal@school.edu' : 'teacher@school.edu',
          role: userRole || 'teacher'
        });
        setIsLoading(false);
      }, 1500);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let mockUser = null;
    let role = 'teacher';
    
    if (email === 'teacher@school.edu' && password === 'password123') {
      mockUser = {
        id: '1',
        name: 'John Teacher',
        email: email,
        role: 'teacher'
      };
      role = 'teacher';
    } else if (email === 'principal@school.edu' && password === 'password123') {
      mockUser = {
        id: '2',
        name: 'Dr. Sarah Principal',
        email: email,
        role: 'principal'
      };
      role = 'principal';
    }
    
    if (mockUser) {
      setUser(mockUser);
      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('userRole', role);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};