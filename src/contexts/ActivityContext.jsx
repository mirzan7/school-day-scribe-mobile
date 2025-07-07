import React, { createContext, useContext, useState, useEffect } from 'react';

const ActivityContext = createContext(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);

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

  const addActivity = (activity) => {
    const newActivity = {
      ...activity,
      id: Date.now().toString(),
      isApproved: false
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = (id, updatedActivity) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id ? { ...updatedActivity, id } : activity
      )
    );
  };

  const approveActivity = (id, approvedBy) => {
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

  const getActivitiesByDate = (date) => {
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