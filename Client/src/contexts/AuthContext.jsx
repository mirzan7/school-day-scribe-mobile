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
    // Check for existing token on app load
    const token = localStorage.getItem('authToken');
    if (token) {
      // Simulate token validation
      setTimeout(() => {
        setUser({
          id: '1',
          name: 'John Teacher',
          email: 'john.teacher@school.edu',
          role: 'teacher'
        });
        setIsLoading(false);
      }, 1500);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation (in real app, this would be an API call)
    if (email === 'teacher@school.edu' && password === 'password123') {
      const mockUser = {
        id: '1',
        name: 'John Teacher',
        email: email,
        role: 'teacher'
      };
      setUser(mockUser);
      localStorage.setItem('authToken', 'mock-jwt-token');
      setIsLoading(false);
      return true;
    } else if (email === 'principal@school.edu' && password === 'password123') {
      const mockUser = {
        id: '2',
        name: 'Principal Smith',
        email: email,
        role: 'principal'
      };
      setUser(mockUser);
      localStorage.setItem('authToken', 'mock-jwt-token');
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
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