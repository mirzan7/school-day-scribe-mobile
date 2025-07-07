
import React from 'react';
import { GraduationCap } from 'lucide-react';

interface AppHeaderProps {
  title: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center">
        <div className="bg-blue-600 rounded-lg p-2 mr-3">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  );
};

export default AppHeader;
