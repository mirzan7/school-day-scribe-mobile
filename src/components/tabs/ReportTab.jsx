import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Users, TrendingUp, CalendarDays, CheckCircle2, Send, AlertCircle, BarChart3, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const ReportTab = () => {
  const { getActivitiesByDate, getActiveDate, approveActivity, rejectActivity, getPendingActivities, getAllTeachers, getActivitiesByTeacher } = useActivity();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  const activeDates = getActiveDate().map(dateStr => new Date(dateStr));
  const selectedActivities = selectedDate ? getActivitiesByDate(format(selectedDate, 'yyyy-MM-dd')) : [];
  const pendingActivities = getPendingActivities();
  const allTeachers = getAllTeachers();

  const handleApprove = (activityId) => {
    approveActivity(activityId, user?.name || 'Principal');
    toast({
      title: "Activity Approved",
      description: "The activity has been approved successfully.",
    });
  };

  const handleReject = (activityId, reason = 'Not specified') => {
    rejectActivity(activityId, user?.name || 'Principal', reason);
    toast({
      title: "Activity Rejected",
      description: "The activity has been rejected.",
      variant: "destructive"
    });
  };

  const getApprovalStats = () => {
    const total = selectedActivities.length;
    const approved = selectedActivities.filter(a => a.isApproved).length;
    const pending = selectedActivities.filter(a => a.sentForApproval && !a.isApproved && !a.isRejected).length;
    const rejected = selectedActivities.filter(a => a.isRejected).length;
    return { total, approved, pending, rejected };
  };

  const stats = getApprovalStats();

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

  // Principal view - show teacher-based reports
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

        {/* Pending Approvals */}
        {pendingActivities.length > 0 && (
          <Card className="bg-amber-50 border-amber-200 border-0 minimal-shadow-lg animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-800">
                <AlertCircle className="h-5 w-5" />
                <span>Pending Approvals ({pendingActivities.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingActivities.slice(0, 3).map(activity => (
                <div key={activity.id} className="bg-white rounded-xl p-4 minimal-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Period {activity.period}
                        </Badge>
                        <Badge className="text-xs bg-blue-100 text-blue-800 border-0">
                          {activity.class}
                        </Badge>
                      </div>
                      <p className="font-medium text-gray-900">{activity.subject}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(activity.date), 'MMM d')} • {activity.teacherName}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-3">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(activity.id)}
                        className="theme-primary rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(activity.id)}
                        className="rounded-lg"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingActivities.length > 3 && (
                <p className="text-sm text-amber-700 text-center">
                  +{pendingActivities.length - 3} more pending approvals
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Teachers List */}
        <Card className="border-0 minimal-shadow-lg animate-slide-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <User className="h-5 w-5 theme-text" />
              <span>Select Teacher</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allTeachers.map(teacher => {
              const teacherActivities = getActivitiesByTeacher(teacher.id);
              const pendingCount = pendingActivities.filter(a => a.teacherId === teacher.id).length;
              
              return (
                <div 
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className={`p-4 rounded-xl border-0 minimal-shadow transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                    selectedTeacher?.id === teacher.id 
                      ? 'theme-primary-light theme-border' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
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
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800 border-0">
                        {teacherActivities.length} activities
                      </Badge>
                      {pendingCount > 0 && (
                        <Badge className="bg-amber-100 text-amber-800 border-0">
                          {pendingCount} pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

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
                    {stats.rejected > 0 && (
                      <Badge className="bg-red-100 text-red-800 border-0">
                        {stats.rejected} rejected
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {selectedActivities.length > 0 ? (
                <div className="space-y-4">
                  {selectedActivities
                    .filter(activity => !selectedTeacher || activity.teacherId === selectedTeacher.id)
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
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
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
                                <p className="text-xs text-gray-500 mt-1">
                                  Teacher: {activity.teacherName}
                                </p>
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
                              </div>
                            </div>
                            {activity.sentForApproval && !activity.isApproved && !activity.isRejected && (
                              <div className="flex space-x-2 ml-3">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(activity.id)}
                                  className="theme-primary rounded-lg"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(activity.id)}
                                  className="rounded-lg"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
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
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedTeacher 
                      ? `No activities found for ${selectedTeacher.name} on this date`
                      : 'No activities found for this date'
                    }
                  </p>
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
  }

  // Teacher view - same as before but with teacher perspective
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