import React from 'react';
import { GraduationCap } from 'lucide-react';

const AppHeader = ({ title }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 px-6 py-4 sticky top-0 z-40 minimal-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="theme-primary rounded-xl p-2.5 minimal-shadow">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">School Reporter</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 theme-primary rounded-full animate-pulse"></div>
          <span className="text-xs theme-text font-medium">Live</span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;