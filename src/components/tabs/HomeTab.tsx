
import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Plus, Clock, BookOpen, PlusCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const HomeTab = () => {
  const { addActivity, getActivitiesByDate } = useActivity();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    description: '',
    customClass: '',
    customSubject: ''
  });
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  const periods = Array.from({ length: 8 }, (_, i) => i + 1);
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const todayActivities = getActivitiesByDate(dateString);

  const defaultClasses = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
  const defaultSubjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];

  const handleAddActivity = (period: number) => {
    setSelectedPeriod(period);
    setIsDialogOpen(true);
    
    // Pre-fill if activity exists for this period
    const existingActivity = todayActivities.find(a => a.period === period);
    if (existingActivity) {
      setFormData({
        class: existingActivity.class,
        subject: existingActivity.subject,
        description: existingActivity.description,
        customClass: '',
        customSubject: ''
      });
      setIsCustomClass(!defaultClasses.includes(existingActivity.class));
      setIsCustomSubject(!defaultSubjects.includes(existingActivity.subject));
    } else {
      setFormData({ class: '', subject: '', description: '', customClass: '', customSubject: '' });
      setIsCustomClass(false);
      setIsCustomSubject(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClass = isCustomClass ? formData.customClass : formData.class;
    const finalSubject = isCustomSubject ? formData.customSubject : formData.subject;
    
    if (!selectedPeriod || !finalClass || !finalSubject || !formData.description) {
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
      class: finalClass,
      subject: finalSubject,
      description: formData.description
    });

    toast({
      title: "Activity Added",
      description: `Activity for Period ${selectedPeriod} has been saved`,
    });

    setIsDialogOpen(false);
    setFormData({ class: '', subject: '', description: '', customClass: '', customSubject: '' });
    setIsCustomClass(false);
    setIsCustomSubject(false);
  };

  const getPeriodActivity = (period: number) => {
    return todayActivities.find(activity => activity.period === period);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="text-center mb-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Daily Timetable</h2>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('prev')}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
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
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('next')}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Date Actions */}
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="text-xs"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {periods.map(period => {
          const activity = getPeriodActivity(period);
          return (
            <Card key={period} className={`cursor-pointer transition-all ${activity ? 'border-primary bg-primary/5' : 'hover:shadow-md'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Period {period}</h3>
                      {activity ? (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{activity.class} - {activity.subject}</p>
                          <p className="text-gray-500 truncate">{activity.description}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No activity added</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={activity ? "outline" : "default"}
                    onClick={() => handleAddActivity(period)}
                    className="min-w-[80px]"
                  >
                    {activity ? 'Edit' : <><Plus className="h-4 w-4 mr-1" />Add</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Period {selectedPeriod} Activity
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="class">Class & Section</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomClass(!isCustomClass)}
                  className="h-6 text-xs"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  {isCustomClass ? 'Select from list' : 'Add custom'}
                </Button>
              </div>
              {isCustomClass ? (
                <Input
                  placeholder="Enter custom class (e.g., 11-Science-A)"
                  value={formData.customClass}
                  onChange={(e) => setFormData(prev => ({ ...prev, customClass: e.target.value }))}
                />
              ) : (
                <Select value={formData.class} onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultClasses.map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject">Subject</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomSubject(!isCustomSubject)}
                  className="h-6 text-xs"
                >
                  <PlusCircle className="h-3 w-3 mr-1" />
                  {isCustomSubject ? 'Select from list' : 'Add custom'}
                </Button>
              </div>
              {isCustomSubject ? (
                <Input
                  placeholder="Enter custom subject (e.g., Computer Science)"
                  value={formData.customSubject}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSubject: e.target.value }))}
                />
              ) : (
                <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Activity Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the activity (e.g., Worksheet on Fractions)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Activity
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeTab;
