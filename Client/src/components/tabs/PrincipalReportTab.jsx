import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, BookOpen, CheckCircle2, Shield, User, Notebook } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import api from "../../utils/axios";

const PrincipalReportTab = ({ user, approveActivity, rejectActivity }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isTeacherDetailOpen, setIsTeacherDetailOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // This useEffect hook listens for changes to `selectedDate`.
  // When the user clicks a new date on the calendar, `selectedDate` updates,
  // and this hook runs the `fetchData` function.
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) return;

      setIsLoading(true);
      setReportData(null);
      try {
        const date = format(selectedDate, "yyyy-MM-dd");
        const response = await api.get("/principal-reports/", { params: { date } });
        setReportData(response.data);
      } catch (error) {
        console.error("Failed to fetch principal reports:", error);
        toast({
          title: "Error",
          description: "Could not fetch report data for the selected date.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]); // The dependency on `selectedDate` makes the calendar functional.

  const allTeachers = useMemo(() => {
    if (!reportData?.teachers) return [];
    return reportData.teachers.map(teacher => ({
      id: teacher.teacher_id,
      name: teacher.user.username,
      department: teacher.department,
    }));
  }, [reportData]);

  const homeworkReportData = useMemo(() => {
    if (!reportData?.homework_by_teacher) return [];
    return Object.entries(reportData.homework_by_teacher).map(([teacherName, homeworks]) => ({
      teacherId: reportData.teachers.find(t => t.user.username === teacherName)?.teacher_id,
      teacherName,
      homeworkCount: homeworks.length,
      subjects: Array.from(new Set(homeworks.map(hw => hw.subject.name))),
    }));
  }, [reportData]);

  const teacherActivitiesForSelectedDate = useMemo(() => {
    if (!selectedTeacher || !reportData?.reports_by_teacher) return [];
    const activities = reportData.reports_by_teacher[selectedTeacher.name] || [];
    return activities.map(activity => ({
      id: activity.id,
      period: activity.period,
      subject: activity.subject.name,
      description: activity.activity,
      class: activity.class_assigned.name,
      isApproved: activity.status === 'approved',
      isRejected: activity.status === 'rejected',
      sentForApproval: activity.status === 'pending', // Assuming 'pending' status for actions
    }));
  }, [reportData, selectedTeacher]);

  const handleApprove = (activityId) => {
    approveActivity(activityId, user?.name || 'Principal');
    toast({
      title: "Activity Approved",
      description: "The activity has been approved successfully.",
    });
    setIsTeacherDetailOpen(false);
  };

  const handleReject = (activityId, reason = 'Not specified') => {
    rejectActivity(activityId, user?.name || 'Principal', reason);
    toast({
      title: "Activity Rejected",
      description: "The activity has been rejected.",
      variant: "destructive"
    });
    setIsTeacherDetailOpen(false);
  };

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setIsTeacherDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6 pb-32 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 theme-primary rounded-2xl flex items-center justify-center mx-auto minimal-shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Reports</h2>
          <p className="text-gray-600">Review activities by teacher and date</p>
        </div>
      </div>

      {/* Calendar */}
      <Card className="border-0 minimal-shadow-lg animate-slide-up">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <CalendarDays className="h-5 w-5 theme-text" />
            <span>Select Date</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex justify-center pb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State & Dynamic Content */}
      {isLoading && <p className="text-center text-gray-500 animate-pulse">Loading reports...</p>}

      {reportData && !isLoading && (
        <>
          {/* Homework Report Card */}
          <Card className="border-0 minimal-shadow-lg animate-slide-up">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Notebook className="h-5 w-5 theme-text" />
                <span>Homework Report for {format(selectedDate, 'MMM d')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {homeworkReportData.length > 0 ? (
                <div className="space-y-3">
                  {homeworkReportData.map(report => (
                    <div key={report.teacherId} className="p-4 rounded-xl bg-gray-50 border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{report.teacherName}</h4>
                        <Badge variant="secondary">{report.homeworkCount} Assignment(s)</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {report.subjects.map(subject => (
                          <Badge key={subject} variant="outline" className="font-normal">{subject}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No homework was assigned on this date.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teachers List */}
          <Card className="border-0 minimal-shadow-lg animate-slide-up">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-5 w-5 theme-text" />
                <span>Select Teacher to View Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {allTeachers.length > 0 ? allTeachers.map(teacher => (
                <div
                  key={teacher.id}
                  onClick={() => handleTeacherClick(teacher)}
                  className="p-4 rounded-xl border-0 minimal-shadow bg-gray-50 transition-all duration-200 cursor-pointer hover:bg-gray-100 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center minimal-shadow">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{teacher.name}</h4>
                        <p className="text-sm text-gray-600">{teacher.department}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                 <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No teachers submitted reports on this date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Teacher Detail Dialog */}
      <Dialog open={isTeacherDetailOpen} onOpenChange={setIsTeacherDetailOpen}>
        <DialogContent className="max-w-2xl mx-auto rounded-2xl border-0 minimal-shadow-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-left pb-4">
            {selectedTeacher && (
              <DialogTitle className="text-xl">
                {selectedTeacher.name}'s Report
                <p className="text-sm font-normal text-gray-500">
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </p>
              </DialogTitle>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {teacherActivitiesForSelectedDate.length > 0 ? (
              teacherActivitiesForSelectedDate.sort((a, b) => a.period - b.period).map(activity => (
                <div key={activity.id} className={`p-4 rounded-xl border-0 minimal-shadow ${activity.isApproved ? 'theme-primary-light' : activity.isRejected ? 'bg-red-50' : 'bg-amber-50'
                  }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs border-gray-300 mb-2">
                        Period {activity.period}
                      </Badge>
                      <h4 className="font-semibold text-gray-900 flex items-center mb-1">
                        <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                        {activity.subject}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">{activity.description}</p>
                      <p className="text-xs text-gray-500">Class: {activity.class}</p>

                      {activity.sentForApproval && (
                        <div className="flex space-x-2 mt-4">
                          <Button size="sm" onClick={() => handleApprove(activity.id)} className="theme-primary rounded-lg">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(activity.id)} className="rounded-lg">
                            Reject
                          </Button>
                        </div>
                      )}
                      {activity.isApproved && (
                        <p className="text-xs theme-text mt-2 font-medium">
                          ✓ Approved
                        </p>
                      )}
                      {activity.isRejected && (
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          ✗ Rejected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <h3 className="font-semibold text-gray-900 mb-2">No Activities Found</h3>
                <p className="text-sm text-gray-600">
                  {selectedTeacher?.name} has no recorded activities for this date.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrincipalReportTab;