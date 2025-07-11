import React from 'react';
import { Home, Calendar, User } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Report', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 apple-glass border-t border-white/20 z-50">
      <div className="flex justify-around items-center px-6 py-4 safe-area-pb">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center space-y-1 py-3 px-4 rounded-2xl transition-all duration-300 ${
              activeTab === id 
                ? 'apple-button theme-text scale-105' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/30 hover:scale-105'
            }`}
          >
            <Icon className={`h-6 w-6 ${activeTab === id ? 'theme-text' : ''}`} />
            <span className={`text-xs font-medium ${activeTab === id ? 'theme-text' : ''}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;