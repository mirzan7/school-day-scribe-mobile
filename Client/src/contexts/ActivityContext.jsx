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
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('schoolActivities');
    const savedClasses = localStorage.getItem('customClasses');
    const savedSubjects = localStorage.getItem('customSubjects');
    const savedTeachers = localStorage.getItem('schoolTeachers');
    
    if (saved) {
      setActivities(JSON.parse(saved));
    }
    if (savedClasses) {
      setCustomClasses(JSON.parse(savedClasses));
    }
    if (savedSubjects) {
      setCustomSubjects(JSON.parse(savedSubjects));
    }
    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers));
    } else {
      // Initialize with default teachers
      const defaultTeachers = [
        {
          id: 'teacher-1',
          name: 'John Teacher',
          email: 'teacher@school.edu',
          teacherId: 'T001',
          department: 'General Education',
          role: 'teacher'
        },
        {
          id: 'teacher-2',
          name: 'Sarah Mathematics',
          email: 'sarah.math@school.edu',
          teacherId: 'T002',
          department: 'Mathematics',
          role: 'teacher'
        },
        {
          id: 'teacher-3',
          name: 'Mike Science',
          email: 'mike.science@school.edu',
          teacherId: 'T003',
          department: 'Science',
          role: 'teacher'
        }
      ];
      setTeachers(defaultTeachers);
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

  useEffect(() => {
    localStorage.setItem('schoolTeachers', JSON.stringify(teachers));
  }, [teachers]);

  const addActivity = (activity) => {
    const newActivity = {
      ...activity,
      id: Date.now().toString(),
      isApproved: false,
      isRejected: false,
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
              isRejected: false,
              approvedBy, 
              approvedAt: new Date().toISOString() 
            } 
          : activity
      )
    );
  };

  const rejectActivity = (id, rejectedBy, reason = '') => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id 
          ? { 
              ...activity, 
              isApproved: false,
              isRejected: true,
              rejectedBy, 
              rejectedAt: new Date().toISOString(),
              rejectionReason: reason
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

  const addTeacher = (teacher) => {
    const newTeacher = {
      ...teacher,
      id: `teacher-${Date.now()}`,
    };
    setTeachers(prev => [...prev, newTeacher]);
  };

  const getActivitiesByDate = (date) => {
    return activities.filter(activity => activity.date === date);
  };

  const getActivitiesByTeacher = (teacherId) => {
    return activities.filter(activity => activity.teacherId === teacherId);
  };

  const getActiveDate = () => {
    const dates = activities.map(activity => activity.date);
    return [...new Set(dates)];
  };

  const getPendingActivities = () => {
    return activities.filter(activity => activity.sentForApproval && !activity.isApproved && !activity.isRejected);
  };

  const getAllClasses = () => {
    const defaultClasses = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
    return [...defaultClasses, ...customClasses];
  };

  const getAllSubjects = () => {
    const defaultSubjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
    return [...defaultSubjects, ...customSubjects];
  };

  const getAllTeachers = () => {
    return teachers;
  };

  return (
    <ActivityContext.Provider value={{
      activities,
      customClasses,
      customSubjects,
      teachers,
      addActivity,
      updateActivity,
      approveActivity,
      rejectActivity,
      addCustomClass,
      addCustomSubject,
      addTeacher,
      getActivitiesByDate,
      getActivitiesByTeacher,
      getActiveDate,
      getPendingActivities,
      getAllClasses,
      getAllSubjects,
      getAllTeachers
    }}>
      {children}
    </ActivityContext.Provider>
  );
};