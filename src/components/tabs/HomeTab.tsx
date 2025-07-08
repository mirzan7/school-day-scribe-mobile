import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Clock, BookOpen, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Send, PlusCircle, User, Shield, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface FormData {
  class: string;
  subject: string;
  description: string;
  customClass: string;
  customSubject: string;
}

interface Activity {
  id: string;
  date: string;
  period: number;
  class: string;
  subject: string;
  description: string;
  teacherId?: string;
  teacherName?: string;
  isApproved?: boolean;
  isRejected?: boolean;
  sentForApproval?: boolean;
  approvedBy?: string;
  rejectedBy?: string;
  createdAt?: string;
}

interface Teacher {
  id: string;
  name: string;
  department: string;
  teacherId: string;
}

const HomeTab: React.FC = () => {
  const { addActivity, getActivitiesByDate, getAllClasses, getAllSubjects, addCustomClass, addCustomSubject, getPendingActivities, approveActivity, rejectActivity, getAllTeachers } = useActivity();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isCustomClass, setIsCustomClass] = useState<boolean>(false);
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState<boolean>(false);
  const [selectedTeacherPending, setSelectedTeacherPending] = useState<Activity[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    class: '',
    subject: '',
    description: '',
    customClass: '',
    customSubject: ''
  });

  const periods: number[] = Array.from({ length: 8 }, (_, i) => i + 1);
  const dateString: string = format(selectedDate, 'yyyy-MM-dd');
  const todayActivities: Activity[] = getActivitiesByDate(dateString);

  const allClasses: string[] = getAllClasses();
  const allSubjects: string[] = getAllSubjects();
  const allTeachers: Teacher[] = getAllTeachers();
  const pendingActivities: Activity[] = getPendingActivities();

  const handleAddActivity = (period: number): void => {
    setSelectedPeriod(period);
    setIsDialogOpen(true);
    
    const existingActivity = todayActivities.find(a => a.period === period);
    if (existingActivity) {
      setFormData({
        class: existingActivity.class,
        subject: existingActivity.subject,
        description: existingActivity.description,
        customClass: '',
        customSubject: ''
      });
      setIsCustomClass(!allClasses.slice(0, 10).includes(existingActivity.class));
      setIsCustomSubject(!allSubjects.slice(0, 8).includes(existingActivity.subject));
    } else {
      setFormData({ class: '', subject: '', description: '', customClass: '', customSubject: '' });
      setIsCustomClass(false);
      setIsCustomSubject(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    const finalClass = isCustomClass ? formData.customClass.trim() : formData.class;
    const finalSubject = isCustomSubject ? formData.customSubject.trim() : formData.subject;
    
    if (!selectedPeriod || !finalClass || !finalSubject || !formData.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Add custom class/subject to lists if they're new
    if (isCustomClass && formData.customClass.trim()) {
      addCustomClass(formData.customClass.trim());
    }
    if (isCustomSubject && formData.customSubject.trim()) {
      addCustomSubject(formData.customSubject.trim());
    }

    addActivity({
      date: dateString,
      period: selectedPeriod,
      class: finalClass,
      subject: finalSubject,
      description: formData.description.trim()
    });

    toast({
      title: "Activity Sent for Approval",
      description: `Period ${selectedPeriod} activity has been sent to the principal for approval`,
    });

    setIsDialogOpen(false);
    setFormData({ class: '', subject: '', description: '', customClass: '', customSubject: '' });
    setIsCustomClass(false);
    setIsCustomSubject(false);
  };

  const getPeriodActivity = (period: number): Activity | undefined => {
    return todayActivities.find(activity => activity.period === period);
  };

  const navigateDate = (direction: 'prev' | 'next'): void => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const getStatusColor = (activity: Activity | undefined): string => {
    if (!activity) return 'bg-gray-50 border-gray-200';
    if (activity.isApproved) return 'theme-primary-light theme-border';
    if (activity.isRejected) return 'bg-red-50 border-red-200';
    if (activity.sentForApproval) return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getStatusIcon = (activity: Activity | undefined): JSX.Element => {
    if (!activity) return <Plus className="h-5 w-5 text-gray-400" />;
    if (activity.isApproved) return <CheckCircle2 className="h-5 w-5 theme-text" />;
    if (activity.isRejected) return <X className="h-5 w-5 text-red-600" />;
    if (activity.sentForApproval) return <Send className="h-5 w-5 text-amber-600" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  const getTeacherPendingCount = (teacherId: string): number => {
    return pendingActivities.filter(activity => activity.teacherId === teacherId).length;
  };

  const handleTeacherClick = (teacherId: string): void => {
    const teacherPending = pendingActivities.filter(activity => activity.teacherId === teacherId);
    setSelectedTeacherPending(teacherPending);
    setIsPendingDialogOpen(true);
  };

  const handleApprove = (activityId: string): void => {
    approveActivity(activityId, user?.name || 'Principal');
    setSelectedTeacherPending(prev => prev.filter(activity => activity.id !== activityId));
    toast({
      title: "Activity Approved",
      description: "The activity has been approved successfully.",
    });
  };

  const handleReject = (activityId: string, reason: string = 'Not specified'): void => {
    rejectActivity(activityId, user?.name || 'Principal', reason);
    setSelectedTeacherPending(prev => prev.filter(activity => activity.id !== activityId));
    toast({
      title: "Activity Rejected",
      description: "The activity has been rejected.",
      variant: "destructive"
    });
  };

  // Show different view for principal
  if (user?.role === 'principal') {
    return (
      <div className="p-6 space-y-8 pb-32 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 apple-fade-in">
          <div className="w-16 h-16 apple-card-elevated flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 theme-text" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Principal Dashboard</h2>
            <p className="text-gray-600 text-lg">Monitor teacher activities and approvals</p>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingActivities.length > 0 && (
          <div className="apple-card-elevated p-6 apple-slide-up">
            <h3 className="text-xl font-semibold text-amber-800 mb-6 flex items-center">
              <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center mr-3">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              Pending Approvals ({pendingActivities.length})
            </h3>
            <div className="space-y-4">
              {pendingActivities.slice(0, 5).map(activity => (
                <div key={activity.id} className="apple-card p-5">
                  <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Period {activity.period}
                          </Badge>
                          <Badge className="text-xs bg-blue-100 text-blue-800 border-0">
                            {activity.class}
                          </Badge>
                          <Badge className="text-xs bg-green-100 text-green-800 border-0">
                            {activity.subject}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.date), 'MMM d, yyyy')} • {activity.teacherName}
                        </p>
                      </div>
                      <div className="flex space-x-3 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(activity.id)}
                          className="apple-button theme-primary text-white border-0 hover:scale-105"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(activity.id)}
                          className="apple-button bg-red-500 text-white border-0 hover:bg-red-600 hover:scale-105"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pendingActivities.length > 5 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-2 inline-block">
                    +{pendingActivities.length - 5} more pending approvals
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Teachers Overview */}
        <Card className="apple-card-elevated border-0 minimal-shadow-lg animate-slide-up">
          <CardContent className="p-6">
          <h3 className="text-xl font-semibold theme-text mb-6 flex items-center">
            <div className="w-10 h-10 theme-bg-light rounded-2xl flex items-center justify-center mr-3">
              <User className="h-5 w-5 theme-text" />
            </div>
            Teachers Overview
          </h3>
            <div className="grid gap-3">
              {allTeachers
                .sort((a, b) => {
                  const aPendingCount = getTeacherPendingCount(a.id);
                  const bPendingCount = getTeacherPendingCount(b.id);
                  if (aPendingCount !== bPendingCount) {
                    return bPendingCount - aPendingCount; // Teachers with more pending first
                  }
                  // If same pending count, sort by latest activity
                  const aLatestActivity = pendingActivities
                    .filter(activity => activity.teacherId === a.id)
                    .sort((x, y) => new Date(y.createdAt || y.date).getTime() - new Date(x.createdAt || x.date).getTime())[0];
                  const bLatestActivity = pendingActivities
                    .filter(activity => activity.teacherId === b.id)
                    .sort((x, y) => new Date(y.createdAt || y.date).getTime() - new Date(x.createdAt || x.date).getTime())[0];
                  
                  if (!aLatestActivity && !bLatestActivity) return 0;
                  if (!aLatestActivity) return 1;
                  if (!bLatestActivity) return -1;
                  
                  return new Date(bLatestActivity.createdAt || bLatestActivity.date).getTime() - 
                         new Date(aLatestActivity.createdAt || aLatestActivity.date).getTime();
                })
                .map(teacher => {
                const pendingCount = getTeacherPendingCount(teacher.id);
                return (
                  <div 
                    key={teacher.id}
                    onClick={() => pendingCount > 0 && handleTeacherClick(teacher.id)}
                    className={`p-4 rounded-xl border-0 minimal-shadow transition-all duration-200 ${
                      pendingCount > 0 
                        ? 'bg-amber-50 cursor-pointer hover:scale-[1.02]' 
                        : 'bg-gray-50'
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
                        {pendingCount > 0 && (
                          <Badge className="bg-amber-100 text-amber-800 border-0">
                            {pendingCount} pending
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          ID: {teacher.teacherId}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4 animate-slide-up">
          <Card className="theme-bg-light border-0 minimal-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold theme-text">{allTeachers.length}</div>
              <div className="text-sm text-gray-600">Total Teachers</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-0 minimal-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-700">{pendingActivities.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-0 minimal-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">
                {getActivitiesByDate(format(new Date(), 'yyyy-MM-dd')).length}
              </div>
              <div className="text-sm text-gray-600">Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Dialog */}
        <Dialog open={isPendingDialogOpen} onOpenChange={setIsPendingDialogOpen}>
          <DialogContent className="w-full max-w-2xl mx-auto rounded-2xl border-0 minimal-shadow-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader className="text-center pb-4">
              <DialogTitle className="flex items-center justify-center space-x-2 text-xl">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-4 w-4 text-amber-600" />
                </div>
                <span>Pending Approvals</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTeacherPending.map(activity => (
                <div key={activity.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Period {activity.period}
                        </Badge>
                        <Badge className="text-xs bg-blue-100 text-blue-800 border-0">
                          {activity.class}
                        </Badge>
                        <Badge className="text-xs bg-green-100 text-green-800 border-0">
                          {activity.subject}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.date), 'MMM d, yyyy')} • {activity.teacherName}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(activity.id)}
                      className="theme-primary rounded-lg flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(activity.id)}
                      className="rounded-lg flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {selectedTeacherPending.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pending activities for this teacher
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-32 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('prev')}
            className="h-10 w-10 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[240px] justify-center text-center font-medium border-gray-200 hover:border-gray-300 rounded-xl"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'EEEE, MMM d')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl minimal-shadow-lg" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
                className="rounded-xl"
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('next')}
            className="h-10 w-10 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedDate(new Date())}
          className="text-sm theme-text hover:theme-primary-light rounded-lg"
        >
          Jump to Today
        </Button>
      </div>

      {/* Progress Indicator */}
      {todayActivities.length > 0 && (
        <Card className="theme-bg-light border-0 minimal-shadow animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium theme-text">Daily Progress</span>
              <span className="text-sm theme-text">{todayActivities.length}/8 periods</span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div 
                className="theme-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(todayActivities.length / 8) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Cards */}
      <div className="grid gap-4 animate-slide-up">
        {periods.map(period => {
          const activity = getPeriodActivity(period);
          return (
            <Card 
              key={period} 
              className={`transition-all duration-200 hover:scale-[1.02] cursor-pointer border-0 minimal-shadow-lg ${getStatusColor(activity)}`}
              onClick={() => handleAddActivity(period)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center minimal-shadow">
                      {getStatusIcon(activity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">Period {period}</h3>
                        {activity?.isApproved && (
                          <div className="w-2 h-2 theme-primary rounded-full"></div>
                        )}
                      </div>
                      {activity ? (
                        <div className="space-y-1">
                          <p className="font-medium text-gray-700">{activity.class} • {activity.subject}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">{activity.description}</p>
                          {activity.isApproved && (
                            <p className="text-xs theme-text font-medium">✓ Approved by {activity.approvedBy}</p>
                          )}
                          {activity.isRejected && (
                            <p className="text-xs text-red-600 font-medium">✗ Rejected by {activity.rejectedBy}</p>
                          )}
                          {activity.sentForApproval && !activity.isApproved && !activity.isRejected && (
                            <p className="text-xs text-amber-600 font-medium">⏳ Pending approval</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Tap to add activity</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md mx-auto rounded-2xl border-0 minimal-shadow-lg">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="flex items-center justify-center space-x-2 text-xl">
              <div className="w-8 h-8 theme-primary rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span>Period {selectedPeriod}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Class & Section</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomClass(!isCustomClass)}
                  className="h-6 text-xs theme-text"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  {isCustomClass ? 'Select from list' : 'Add new'}
                </Button>
              </div>
              {isCustomClass ? (
                <Input
                  placeholder="Enter new class (e.g., 11-Science-A)"
                  value={formData.customClass}
                  onChange={(e) => setFormData(prev => ({ ...prev, customClass: e.target.value }))}
                  className="rounded-xl border-gray-200 h-12"
                />
              ) : (
                <Select value={formData.class} onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {allClasses.map(cls => (
                      <SelectItem key={cls} value={cls} className="rounded-lg">{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Subject</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomSubject(!isCustomSubject)}
                  className="h-6 text-xs theme-text"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  {isCustomSubject ? 'Select from list' : 'Add new'}
                </Button>
              </div>
              {isCustomSubject ? (
                <Input
                  placeholder="Enter new subject (e.g., Computer Science)"
                  value={formData.customSubject}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSubject: e.target.value }))}
                  className="rounded-xl border-gray-200 h-12"
                />
              ) : (
                <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {allSubjects.map(subject => (
                      <SelectItem key={subject} value={subject} className="rounded-lg">{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Activity Description</Label>
              <Textarea
                placeholder="What did you teach today?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="rounded-xl border-gray-200 resize-none"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)} 
                className="flex-1 rounded-xl border-gray-200 h-12"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 theme-primary rounded-xl h-12 font-medium"
              >
                Send for Approval
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeTab;