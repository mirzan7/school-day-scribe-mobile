import React from 'react';
import { GraduationCap } from 'lucide-react';

const SplashScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="mx-auto bg-white/20 rounded-full p-6 w-24 h-24 flex items-center justify-center mb-6">
          <GraduationCap className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold mb-2">School Reporter</h1>
        <p className="text-blue-100 mb-8">Loading your dashboard...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;