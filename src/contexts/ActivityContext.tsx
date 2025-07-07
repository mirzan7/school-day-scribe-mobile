
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Activity {
  id: string;
  date: string;
  period: number;
  class: string;
  subject: string;
  description: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, activity: Omit<Activity, 'id'>) => void;
  approveActivity: (id: string, approvedBy: string) => void;
  getActivitiesByDate: (date: string) => Activity[];
  getActiveDate: () => string[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Load activities from localStorage on mount
    const saved = localStorage.getItem('schoolActivities');
    if (saved) {
      setActivities(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save activities to localStorage whenever they change
    localStorage.setItem('schoolActivities', JSON.stringify(activities));
  }, [activities]);

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      isApproved: false
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = (id: string, updatedActivity: Omit<Activity, 'id'>) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id ? { ...updatedActivity, id } : activity
      )
    );
  };

  const approveActivity = (id: string, approvedBy: string) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id 
          ? { 
              ...activity, 
              isApproved: true, 
              approvedBy, 
              approvedAt: new Date().toISOString() 
            } 
          : activity
      )
    );
  };

  const getActivitiesByDate = (date: string) => {
    return activities.filter(activity => activity.date === date);
  };

  const getActiveDate = () => {
    const dates = activities.map(activity => activity.date);
    return [...new Set(dates)];
  };

  return (
    <ActivityContext.Provider value={{
      activities,
      addActivity,
      updateActivity,
      approveActivity,
      getActivitiesByDate,
      getActiveDate
    }}>
      {children}
    </ActivityContext.Provider>
  );
};
