
import React, { useState } from 'react';
import { useActivity } from '@/contexts/ActivityContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Users } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

const ReportTab = () => {
  const { getActivitiesByDate, getActiveDate } = useActivity();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const activeDates = getActiveDate().map(dateStr => new Date(dateStr));
  const selectedActivities = selectedDate ? getActivitiesByDate(format(selectedDate, 'yyyy-MM-dd')) : [];

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Report</h2>
        <p className="text-gray-600">Track your daily teaching activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Date</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border-0"
            />
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Active Days
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                No Activities
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedActivities.length > 0 ? (
              <div className="space-y-3">
                {selectedActivities
                  .sort((a, b) => a.period - b.period)
                  .map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-blue-100 rounded-full p-2 mt-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Period {activity.period}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {activity.class}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <BookOpen className="h-4 w-4 mr-1 text-gray-600" />
                          {activity.subject}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No activities recorded for this date</p>
                <p className="text-sm mt-1">Add activities from the Home tab</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{activeDates.length}</div>
              <div className="text-sm text-blue-700">Active Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {getActivitiesByDate(format(new Date(), 'yyyy-MM-dd')).length}
              </div>
              <div className="text-sm text-blue-700">Today's Activities</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportTab;
