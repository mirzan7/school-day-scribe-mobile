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
  const [customClasses, setCustomClasses] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('schoolActivities');
    const savedClasses = localStorage.getItem('customClasses');
    const savedSubjects = localStorage.getItem('customSubjects');
    
    if (saved) {
      setActivities(JSON.parse(saved));
    }
    if (savedClasses) {
      setCustomClasses(JSON.parse(savedClasses));
    }
    if (savedSubjects) {
      setCustomSubjects(JSON.parse(savedSubjects));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('schoolActivities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('customClasses', JSON.stringify(customClasses));
  }, [customClasses]);

  useEffect(() => {
    localStorage.setItem('customSubjects', JSON.stringify(customSubjects));
  }, [customSubjects]);

  const addActivity = (activity) => {
    const newActivity = {
      ...activity,
      id: Date.now().toString(),
      isApproved: false,
      sentForApproval: true,
      sentAt: new Date().toISOString(),
      teacherId: 'teacher-1', // In real app, get from auth context
      teacherName: 'John Teacher'
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

  const addCustomClass = (className) => {
    if (!customClasses.includes(className)) {
      setCustomClasses(prev => [...prev, className]);
    }
  };

  const addCustomSubject = (subjectName) => {
    if (!customSubjects.includes(subjectName)) {
      setCustomSubjects(prev => [...prev, subjectName]);
    }
  };

  const getActivitiesByDate = (date) => {
    return activities.filter(activity => activity.date === date);
  };

  const getActiveDate = () => {
    const dates = activities.map(activity => activity.date);
    return [...new Set(dates)];
  };

  const getPendingActivities = () => {
    return activities.filter(activity => activity.sentForApproval && !activity.isApproved);
  };

  const getAllClasses = () => {
    const defaultClasses = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
    return [...defaultClasses, ...customClasses];
  };

  const getAllSubjects = () => {
    const defaultSubjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
    return [...defaultSubjects, ...customSubjects];
  };

  return (
    <ActivityContext.Provider value={{
      activities,
      customClasses,
      customSubjects,
      addActivity,
      updateActivity,
      approveActivity,
      addCustomClass,
      addCustomSubject,
      getActivitiesByDate,
      getActiveDate,
      getPendingActivities,
      getAllClasses,
      getAllSubjects
    }}>
      {children}
    </ActivityContext.Provider>
  );
};