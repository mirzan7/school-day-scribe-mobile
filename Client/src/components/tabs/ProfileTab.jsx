import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import TeacherProfile from './TeacherProfile.jsx';
import PrincipalProfile from './PrincipalProfile';

const ProfileTab = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    // Optionally, render a loading spinner or a message
    return <div>Loading profile...</div>;
  }

  if (user.role === 'principal') {
    return <PrincipalProfile user={user} handleLogout={handleLogout} />;
  }

  return <TeacherProfile user={user} handleLogout={handleLogout} />;
};

export default ProfileTab;