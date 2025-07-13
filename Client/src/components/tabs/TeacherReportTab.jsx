import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
    CalendarDays,
    BarChart3,
    Notebook,
} from "lucide-react";
import { format, isSameDay, startOfToday } from "date-fns";
import api from "../../utils/axios";

const TeacherReportTab = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activities, setActivities] = useState([]); // State to hold fetched activities

    // Fetch data from the backend whenever the selected date changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                const date = format(selectedDate, "yyyy-MM-dd");
                const response = await api.get("/teacher-reports/", {
                    params: { date },
                });
                setActivities(response.data || []); // Update state with fetched data
                console.log(response.data);
            } catch (error) {
                console.error("Failed to fetch teacher data:", error);
                setActivities([]); // Clear activities on error
            }
        };

        fetchData();
    }, [selectedDate]);

    // Memoize calculations to avoid re-computing on every render
    const { activeDates, todaysActivitiesCount, homeworkActivitiesForDate } = React.useMemo(() => {
        const uniqueDates = [
            ...new Set(activities.map(a => format(new Date(a.created_at), 'yyyy-MM-dd')))
        ];
        
        const todaysActivities = activities.filter(a => 
            isSameDay(new Date(a.created_at), startOfToday())
        );

        const homework = activities.filter(a => a.homework_title);

        return {
            activeDates: uniqueDates.map(d => new Date(d)),
            todaysActivitiesCount: todaysActivities.length,
            homeworkActivitiesForDate: homework,
        };
    }, [activities]);

    const modifiers = {
        active: activeDates,
    };

    const modifiersStyles = {
        active: {
            backgroundColor: "#028a0f",
            color: "white",
            borderRadius: "8px",
        },
    };

    return (
        <div className="p-6 space-y-6 pb-32 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 theme-primary rounded-2xl flex items-center justify-center mx-auto minimal-shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        My Activity Reports
                    </h2>
                    <p className="text-gray-600">
                        Track your teaching activities and approval status
                    </p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-4 animate-slide-up">
                <Card className="theme-bg-light border-0 minimal-shadow">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold theme-text">
                            {activeDates.length}
                        </div>
                        <div className="text-sm text-gray-600">Active Days</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-0 minimal-shadow">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">
                            {todaysActivitiesCount}
                        </div>
                        <div className="text-sm text-gray-600">
                            Today's Activities
                        </div>
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
                </CardContent>
            </Card>

            {/* Selected Date Activities */}
            {selectedDate && (
                <Card className="border-0 minimal-shadow-lg animate-slide-up">
                    <CardHeader className="theme-bg-light rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <CalendarDays className="h-5 w-5 theme-text" />
                                <span className="theme-text">
                                    {format(selectedDate, "EEEE, MMM d")}
                                </span>
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {activities.length > 0 ? (
                            <div className="space-y-4">
                                {activities
                                    .sort((a, b) => a.period - b.period)
                                    .map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="p-4 rounded-xl bg-gray-50 border"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline">
                                                    Period {activity.period}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {activity.class_assigned_name}
                                                </Badge>
                                            </div>
                                            <h4 className="font-semibold text-gray-800 mb-1">
                                                {activity.subject_name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {activity.activity}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <h3 className="font-semibold">
                                    No activities recorded for this date.
                                </h3>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Homework Activities for Selected Date */}
            {selectedDate && homeworkActivitiesForDate.length > 0 && (
                <Card className="border-0 minimal-shadow-lg animate-slide-up">
                    <CardHeader className="theme-bg-light rounded-t-xl">
                        <CardTitle className="flex items-center space-x-2">
                            <Notebook className="h-5 w-5 theme-text" />
                            <span className="theme-text">
                                Homework on {format(selectedDate, "MMM d")}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {homeworkActivitiesForDate.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="p-4 rounded-xl border bg-gray-50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline">
                                            Period {activity.period}
                                        </Badge>
                                        <Badge variant="secondary">
                                            {activity.class_assigned_name}
                                        </Badge>
                                    </div>
                                    <h4 className="font-semibold text-gray-800 mb-1">
                                        {activity.subject_name}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {activity.homework_title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TeacherReportTab;