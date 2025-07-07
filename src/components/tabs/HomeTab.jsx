import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Plus, Clock, BookOpen, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const HomeTab = () => {
  const { addActivity, getActivitiesByDate } = useActivity();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    description: ''
  });

  const periods = Array.from({ length: 8 }, (_, i) => i + 1);
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const todayActivities = getActivitiesByDate(dateString);

  const defaultClasses = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
  const defaultSubjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];

  const handleAddActivity = (period) => {
    setSelectedPeriod(period);
    setIsDialogOpen(true);
    
    const existingActivity = todayActivities.find(a => a.period === period);
    if (existingActivity) {
      setFormData({
        class: existingActivity.class,
        subject: existingActivity.subject,
        description: existingActivity.description
      });
    } else {
      setFormData({ class: '', subject: '', description: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedPeriod || !formData.class || !formData.subject || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    addActivity({
      date: dateString,
      period: selectedPeriod,
      class: formData.class,
      subject: formData.subject,
      description: formData.description
    });

    toast({
      title: "Activity Added & Sent",
      description: `Period ${selectedPeriod} activity has been automatically sent for approval`,
    });

    setIsDialogOpen(false);
    setFormData({ class: '', subject: '', description: '' });
  };

  const getPeriodActivity = (period) => {
    return todayActivities.find(activity => activity.period === period);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const getStatusColor = (activity) => {
    if (!activity) return 'bg-gray-50 border-gray-200';
    if (activity.isApproved) return 'theme-primary-light theme-border';
    if (activity.sentForApproval) return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getStatusIcon = (activity) => {
    if (!activity) return <Plus className="h-5 w-5 text-gray-400" />;
    if (activity.isApproved) return <CheckCircle2 className="h-5 w-5 theme-text" />;
    if (activity.sentForApproval) return <Send className="h-5 w-5 text-amber-600" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  return (
    <div className="p-6 space-y-6 pb-24 max-w-2xl mx-auto">
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
                            <p className="text-xs theme-text font-medium">✓ Approved</p>
                          )}
                          {activity.sentForApproval && !activity.isApproved && (
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
              <Label className="text-sm font-medium text-gray-700">Class & Section</Label>
              <Select value={formData.class} onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}>
                <SelectTrigger className="rounded-xl border-gray-200 h-12">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {defaultClasses.map(cls => (
                    <SelectItem key={cls} value={cls} className="rounded-lg">{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Subject</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger className="rounded-xl border-gray-200 h-12">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {defaultSubjects.map(subject => (
                    <SelectItem key={subject} value={subject} className="rounded-lg">{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Save & Send
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeTab;