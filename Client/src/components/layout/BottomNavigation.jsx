import React from 'react';
import { Home, Calendar, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const BottomNavigation = () => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'report', label: 'Report', icon: Calendar, path: '/report' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 apple-glass border-t border-white/20 z-50">
      <div className="flex justify-around items-center px-6 py-4 safe-area-pb">
        {tabs.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path}
            className={({ isActive }) => 
              `flex flex-col items-center space-y-1 py-3 px-4 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'apple-button theme-text scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30 hover:scale-105'
              }`
            }
          >
            <Icon className={({ isActive }) => `h-6 w-6 ${isActive ? 'theme-text' : ''}`} />
            <span className={({ isActive }) => `text-xs font-medium ${isActive ? 'theme-text' : ''}`}>
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;