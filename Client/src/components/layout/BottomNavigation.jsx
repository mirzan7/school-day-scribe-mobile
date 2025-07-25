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
    <nav className="fixed bottom-0 left-0 right-0 apple-glass border-t border-white/20 z-50 safe-area-pb">
      <div className="flex justify-around items-center px-6 py-4">
        {tabs.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path}
            className={({ isActive }) => 
              `flex flex-col items-center space-y-1 py-3 px-4 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-500 text-white scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30 hover:scale-105'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-6 w-6 ${isActive ? 'text-white' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
