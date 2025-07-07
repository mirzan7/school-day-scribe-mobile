
import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Clock, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

const HomeTab = () => {
  const { addActivity, getActivitiesByDate } = useActivity();
  const [selectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    description: ''
  });

  const periods = Array.from({ length: 8 }, (_, i) => i + 1);
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const todayActivities = getActivitiesByDate(dateString);

  const classes = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];

  const handleAddActivity = (period: number) => {
    setSelectedPeriod(period);
    setIsDialogOpen(true);
    
    // Pre-fill if activity exists for this period
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

  const handleSubmit = (e: React.FormEvent) => {
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
      title: "Activity Added",
      description: `Activity for Period ${selectedPeriod} has been saved`,
    });

    setIsDialogOpen(false);
    setFormData({ class: '', subject: '', description: '' });
  };

  const getPeriodActivity = (period: number) => {
    return todayActivities.find(activity => activity.period === period);
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Timetable</h2>
        <p className="text-gray-600">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid gap-3">
        {periods.map(period => {
          const activity = getPeriodActivity(period);
          return (
            <Card key={period} className={`cursor-pointer transition-all ${activity ? 'border-green-200 bg-green-50' : 'hover:shadow-md'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Clock className="h-5 w-5 text-blue-600" />
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
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Period {selectedPeriod} Activity
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class & Section</Label>
              <Select value={formData.class} onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
