import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ActivityProvider } from '@/contexts/ActivityContext';
import LoginScreen from '@/components/auth/LoginScreen';
import SplashScreen from '@/components/auth/SplashScreen';
import MainApp from '@/components/MainApp';

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <MainApp />;
};

const Index = () => {
  return (
    <AuthProvider>
      <ActivityProvider>
        <AppContent />
      </ActivityProvider>
    </AuthProvider>
  );
};

export default Index;