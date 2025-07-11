import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, BookOpen, Users, CalendarDays, CheckCircle2, Send, AlertCircle, BarChart3, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const ReportTab = () => {
  const { getActivitiesByDate, getActiveDate, approveActivity, rejectActivity, getAllTeachers, getActivitiesByTeacher } = useActivity();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isTeacherDetailOpen, setIsTeacherDetailOpen] = useState(false);

  const activeDates = getActiveDate().map(dateStr => new Date(dateStr));
  const selectedActivities = selectedDate ? getActivitiesByDate(format(selectedDate, 'yyyy-MM-dd')) : [];
  const allTeachers = getAllTeachers();

  const handleApprove = (activityId) => {
    approveActivity(activityId, user?.name || 'Principal');
    toast({
      title: "Activity Approved",
      description: "The activity has been approved successfully.",
    });
    // Close dialog and refresh data if needed
    setIsTeacherDetailOpen(false);
  };

  const handleReject = (activityId, reason = 'Not specified') => {
    rejectActivity(activityId, user?.name || 'Principal', reason);
    toast({
      title: "Activity Rejected",
      description: "The activity has been rejected.",
      variant: "destructive"
    });
    // Close dialog and refresh data if needed
    setIsTeacherDetailOpen(false);
  };

  const getApprovalStats = () => {
    const total = selectedActivities.length;
    const approved = selectedActivities.filter(a => a.isApproved).length;
    const pending = selectedActivities.filter(a => a.sentForApproval && !a.isApproved && !a.isRejected).length;
    const rejected = selectedActivities.filter(a => a.isRejected).length;
    return { total, approved, pending, rejected };
  };

  const stats = getApprovalStats();

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setIsTeacherDetailOpen(true);
  };
  
  const teacherActivitiesForSelectedDate = selectedTeacher
    ? selectedActivities.filter(activity => activity.teacherId === selectedTeacher.id)
    : [];

  const modifiers = {
    active: activeDates,
  };

  const modifiersStyles = {
    active: {
      backgroundColor: '#028a0f',
      color: 'white',
      borderRadius: '8px',
    },
  };

  // Principal view
  if (user?.role === 'principal') {
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
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* All Activities on Selected Date */}
        {selectedDate && (
          <Card className="border-0 minimal-shadow-lg animate-slide-up">
            <CardHeader className="theme-bg-light rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5 theme-text" />
                  <span className="theme-text">All Activities for {format(selectedDate, 'MMM d')}</span>
                </CardTitle>
                 {selectedActivities.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Badge className="theme-primary-light theme-text border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {stats.approved}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-800 border-0">
                      <Send className="h-3 w-3 mr-1" />
                      {stats.pending}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {selectedActivities.length > 0 ? (
                <div className="space-y-4">
                  {selectedActivities.sort((a, b) => a.period - b.period).map(activity => (
                    <div key={activity.id} className="p-4 rounded-xl border-0 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs border-gray-300">
                              Period {activity.period}
                            </Badge>
                            {activity.isApproved ? (
                              <Badge className="theme-primary-light theme-text">Approved</Badge>
                            ) : activity.isRejected ? (
                              <Badge variant="destructive">Rejected</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900">{activity.subject}</h4>
                          <p className="text-sm text-gray-600 truncate mb-2">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            Teacher: {activity.teacherName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="font-semibold text-gray-900 mb-2">No Activities Found</h3>
                  <p className="text-sm text-gray-600">No activities were recorded for any teacher on this date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Teachers List */}
        <Card className="border-0 minimal-shadow-lg animate-slide-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <User className="h-5 w-5 theme-text" />
              <span>Select Teacher to View Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allTeachers.map(teacher => (
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
            ))}
          </CardContent>
        </Card>

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
                teacherActivitiesForSelectedDate.sort((a,b) => a.period - b.period).map(activity => (
                  <div key={activity.id} className={`p-4 rounded-xl border-0 minimal-shadow ${
                    activity.isApproved ? 'theme-primary-light' : activity.isRejected ? 'bg-red-50' : 'bg-amber-50'
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

                        {activity.sentForApproval && !activity.isApproved && !activity.isRejected && (
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
                             ✓ Approved by {activity.approvedBy}
                          </p>
                        )}
                        {activity.isRejected && (
                          <p className="text-xs text-red-600 mt-2 font-medium">
                             ✗ Rejected by {activity.rejectedBy}
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
  }

  // Teacher view
  return (
    <div className="p-6 space-y-6 pb-32 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 theme-primary rounded-2xl flex items-center justify-center mx-auto minimal-shadow-lg">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Activity Reports</h2>
          <p className="text-gray-600">Track your teaching activities and approval status</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up">
        <Card className="theme-bg-light border-0 minimal-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold theme-text">{activeDates.length}</div>
            <div className="text-sm text-gray-600">Active Days</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-0 minimal-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {getActivitiesByDate(format(new Date(), 'yyyy-MM-dd')).length}
            </div>
            <div className="text-sm text-gray-600">Today's Activities</div>
          </CardContent>
        </Card>
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
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-xl"
            />
          </div>
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 theme-primary rounded"></div>
                <span className="text-gray-600">Active Days</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span className="text-gray-600">No Activities</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Activities */}
      {selectedDate && (
        <Card className="border-0 minimal-shadow-lg animate-slide-up">
          <CardHeader className="theme-bg-light rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 theme-text" />
                <span className="theme-text">{format(selectedDate, 'EEEE, MMM d')}</span>
              </CardTitle>
              {selectedActivities.length > 0 && (
                <div className="flex items-center space-x-2">
                   <Badge className="theme-primary-light theme-text border-0">
                     <CheckCircle2 className="h-3 w-3 mr-1" />
                     {stats.approved}
                   </Badge>
                   <Badge className="bg-amber-100 text-amber-800 border-0">
                     <Send className="h-3 w-3 mr-1" />
                     {stats.pending}
                   </Badge>
                 </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {selectedActivities.length > 0 ? (
              <div className="space-y-4">
                {selectedActivities
                  .sort((a, b) => a.period - b.period)
                  .map(activity => (
                    <div key={activity.id} className="group">
                      <div className={`p-4 rounded-xl border-0 minimal-shadow transition-all duration-200 ${
                        activity.isApproved
                          ? 'theme-primary-light'
                          : activity.isRejected
                          ? 'bg-red-50'
                          : activity.sentForApproval
                          ? 'bg-amber-50'
                          : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activity.isApproved
                              ? 'bg-white/80'
                              : 'bg-white/60'
                          }`}>
                            {activity.isApproved ? (
                              <CheckCircle2 className="h-5 w-5 theme-text" />
                            ) : activity.isRejected ? (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            ) : activity.sentForApproval ? (
                              <Send className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-xs border-gray-300">
                                Period {activity.period}
                              </Badge>
                              <Badge className="text-xs bg-blue-100 text-blue-800 border-0">
                                <Users className="h-3 w-3 mr-1" />
                                {activity.class}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-gray-900 flex items-center mb-1">
                              <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                              {activity.subject}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                            {activity.isApproved && (
                              <p className="text-xs theme-text mt-2 font-medium">
                                ✓ Approved by {activity.approvedBy}
                              </p>
                            )}
                            {activity.isRejected && (
                              <p className="text-xs text-red-600 mt-2 font-medium">
                                ✗ Rejected by {activity.rejectedBy}
                                {activity.rejectionReason && `: ${activity.rejectionReason}`}
                              </p>
                            )}
                            {activity.sentForApproval && !activity.isApproved && !activity.isRejected && (
                              <p className="text-xs text-amber-600 mt-2 font-medium">
                                ⏳ Waiting for principal approval
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No activities recorded</h3>
                <p className="text-sm text-gray-600 mb-4">Add activities from the Home tab to see them here</p>
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 max-w-xs mx-auto">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportTab;