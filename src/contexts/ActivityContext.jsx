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
  const [dayApprovals, setDayApprovals] = useState([]);

  useEffect(() => {
    // Load activities from localStorage on mount
    const saved = localStorage.getItem('schoolActivities');
    if (saved) {
      setActivities(JSON.parse(saved));
    }
    
    const savedDayApprovals = localStorage.getItem('schoolDayApprovals');
    if (savedDayApprovals) {
      setDayApprovals(JSON.parse(savedDayApprovals));
    }
  }, []);

  useEffect(() => {
    // Save activities to localStorage whenever they change
    localStorage.setItem('schoolActivities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    // Save day approvals to localStorage whenever they change
    localStorage.setItem('schoolDayApprovals', JSON.stringify(dayApprovals));
  }, [dayApprovals]);

  const addActivity = (activity) => {
    const newActivity = {
      ...activity,
      id: Date.now().toString(),
      isApproved: false,
      sentForApproval: false
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

  const sendForApproval = (id) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id 
          ? { 
              ...activity, 
              sentForApproval: true,
              sentAt: new Date().toISOString()
            } 
          : activity
      )
    );
  };

  const sendDayForApproval = (date) => {
    // Mark all activities for the day as sent for approval
    setActivities(prev =>
      prev.map(activity =>
        activity.date === date 
          ? { 
              ...activity, 
              sentForApproval: true,
              sentAt: new Date().toISOString()
            } 
          : activity
      )
    );
    
    // Add day approval record
    const dayApproval = {
      id: Date.now().toString(),
      date,
      sentAt: new Date().toISOString(),
      isApproved: false
    };
    setDayApprovals(prev => [...prev, dayApproval]);
  };

  const approveDayActivities = (date, approvedBy) => {
    // Approve all activities for the day
    setActivities(prev =>
      prev.map(activity =>
        activity.date === date 
          ? { 
              ...activity, 
              isApproved: true,
              approvedBy,
              approvedAt: new Date().toISOString()
            } 
          : activity
      )
    );
    
    // Update day approval record
    setDayApprovals(prev =>
      prev.map(dayApproval =>
        dayApproval.date === date
          ? {
              ...dayApproval,
              isApproved: true,
              approvedBy,
              approvedAt: new Date().toISOString()
            }
          : dayApproval
      )
    );
  };

  const getDayApprovalStatus = (date) => {
    return dayApprovals.find(approval => approval.date === date);
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
      sendForApproval,
      sendDayForApproval,
      approveDayActivities,
      getDayApprovalStatus,
      getActivitiesByDate,
      getActiveDate
    }}>
      {children}
    </ActivityContext.Provider>
  );
};