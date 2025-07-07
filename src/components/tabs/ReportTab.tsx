
import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Users, TrendingUp, CalendarDays, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const ReportTab = () => {
  const { getActivitiesByDate, getActiveDate, approveActivity } = useActivity();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const activeDates = getActiveDate().map(dateStr => new Date(dateStr));
  const selectedActivities = selectedDate ? getActivitiesByDate(format(selectedDate, 'yyyy-MM-dd')) : [];

  const handleApprove = (activityId: string) => {
    approveActivity(activityId, 'Principal John Smith');
    toast({
      title: "Activity Approved",
      description: "The activity has been approved by the principal.",
    });
  };

  const getApprovalStats = () => {
    const total = selectedActivities.length;
    const approved = selectedActivities.filter(a => a.isApproved).length;
    const pending = total - approved;
    return { total, approved, pending };
  };

  const stats = getApprovalStats();

  const modifiers = {
    active: activeDates,
  };

  const modifiersStyles = {
    active: {
      backgroundColor: '#028a0f',
      color: 'white',
      borderRadius: '50%',
    },
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 mb-4">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Activity Report</h2>
          <p className="text-muted-foreground">Track your daily teaching activities and progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{activeDates.length}</div>
              <div className="text-sm text-primary/80">Active Days</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {getActivitiesByDate(format(new Date(), 'yyyy-MM-dd')).length}
              </div>
              <div className="text-sm text-green-600">Today's Activities</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border-0 pointer-events-auto"
            />
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                <span className="text-muted-foreground">Active Days</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-muted rounded-full mr-2"></div>
                <span className="text-muted-foreground">No Activities</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <CalendarDays className="h-5 w-5 mr-2 text-primary" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              {selectedActivities.length > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {stats.approved} Approved
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {stats.pending} Pending
                  </Badge>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {selectedActivities.length > 0 ? (
              <div className="space-y-3">
                {selectedActivities
                  .sort((a, b) => a.period - b.period)
                  .map(activity => (
                    <div key={activity.id} className="group hover:scale-[1.02] transition-all duration-200">
                      <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-card to-muted/20 rounded-xl border border-border/50 group-hover:shadow-md relative">
                        <div className="bg-primary/10 rounded-full p-2 mt-1">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs font-medium">
                              Period {activity.period}
                            </Badge>
                            <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                              <Users className="h-3 w-3 mr-1" />
                              {activity.class}
                            </Badge>
                            {/* Approval Status Badge */}
                            {activity.isApproved ? (
                              <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-foreground flex items-center mb-1">
                            <BookOpen className="h-4 w-4 mr-2 text-primary" />
                            {activity.subject}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                          {activity.isApproved && activity.approvedBy && (
                            <p className="text-xs text-green-600 mt-2">
                              Approved by {activity.approvedBy} on {format(new Date(activity.approvedAt!), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        {/* Approval Action */}
                        {!activity.isApproved && (
                          <div className="absolute top-4 right-4">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(activity.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-foreground mb-2">No activities recorded</h3>
                <p className="text-sm text-muted-foreground mb-4">Add activities from the Home tab to see them here</p>
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 max-w-xs mx-auto">
                  Selected: {format(selectedDate, 'MMM d, yyyy')}
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
