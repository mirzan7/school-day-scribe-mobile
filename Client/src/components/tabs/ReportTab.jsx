import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import PrincipalReportTab from './PrincipalReportTab';
import TeacherReportTab from './TeacherReportTab';
import { useActivity } from '@/contexts/ActivityContext';

const ReportTab = () => {
  const { user } = useAuth();
  const activityData = useActivity();

  if (user?.role === 'principal') {
    return <PrincipalReportTab user={user} {...activityData} />;
  }

  return <TeacherReportTab user={user} {...activityData} />;
};

export default ReportTab;