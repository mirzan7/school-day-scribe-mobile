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
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const activeDates = getActiveDate().map(dateStr => new Date(dateStr));
  const selectedActivities = selectedDate ? getActivitiesByDate(format(selectedDate, 'yyyy-MM-dd')) : [];

  const handleApprove = (activityId) => {
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
      backgroundColor: '#10b981',
      color: 'white',
      borderRadius: '50%',
    },
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-4">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Report</h2>
          <p className="text-gray-600">Track your daily teaching activities and progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{activeDates.length}</div>
              <div className="text-sm text-blue-600">Active Days</div>
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

      {/* Approval Stats */}
      {selectedActivities.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">{stats.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">{stats.approved}</div>
                <div className="text-xs text-green-600">Approved</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-700">{stats.pending}</div>
                <div className="text-xs text-orange-600">Pending</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
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
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Active Days</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                <span className="text-gray-600">No Activities</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              {selectedActivities.length > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {stats.approved} Approved
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
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
                      <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 group-hover:shadow-md relative">
                        <div className="bg-blue-100 rounded-full p-2 mt-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs font-medium border-gray-300">
                              Period {activity.period}
                            </Badge>
                            <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200">
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
                              <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 flex items-center mb-1">
                            <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                            {activity.subject}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                          {activity.isApproved && activity.approvedBy && (
                            <p className="text-xs text-green-600 mt-2">
                              Approved by {activity.approvedBy} on {format(new Date(activity.approvedAt), 'MMM d, yyyy')}
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
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No activities recorded</h3>
                <p className="text-sm text-gray-600 mb-4">Add activities from the Home tab to see them here</p>
                <div className="text-xs text-gray-600 bg-gray-100 rounded-lg p-3 max-w-xs mx-auto">
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