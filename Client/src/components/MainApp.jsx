import React, { useState } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BottomNavigation from '@/components/layout/BottomNavigation';
import HomeTab from '@/components/tabs/HomeTab';
import ReportTab from '@/components/tabs/ReportTab';
import ProfileTab from '@/components/tabs/ProfileTab';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('home');

  const getTabTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Timetable';
      case 'report':
        return 'Reports';
      case 'profile':
        return 'Profile';
      default:
        return 'School Reporter';
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'report':
        return <ReportTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader title={getTabTitle()} />
      <main className="overflow-y-auto pb-24">
        {renderActiveTab()}
      </main>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MainApp;