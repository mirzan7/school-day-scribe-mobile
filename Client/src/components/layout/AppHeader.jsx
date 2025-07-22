import React from 'react';
import { GraduationCap } from 'lucide-react';

const AppHeader = ({ title }) => {
  return (
    <header className="apple-glass sticky top-0 z-50 border-b border-white/20 safe-area-pt">
      <div className="flex items-center px-6 py-4">
        <div className="bg-blue-500 rounded-2xl p-3 mr-4 apple-scale-in">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
      </div>
    </header>
  );
};

export default AppHeader;
