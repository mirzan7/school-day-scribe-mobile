import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { User, Shield, X, Check } from "lucide-react";
import { format } from "date-fns";
import api from "../../utils/axios";

const PrincipalView = ({ user, approveActivity, rejectActivity }) => {
    // State to hold data from the API
    const [reports, setReports] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);

    // Dialog state
    const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);
    const [selectedTeacherPending, setSelectedTeacherPending] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Dedicated API call for the principal
                const response = await api.get("/principal-dashboard/");
                
                setReports(response.data.reports || []);
                setTeachers(response.data.teachers || []);
                setClasses(response.data.classes || []);
            } catch (error) {
                console.error("Failed to fetch principal data:", error);
                toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
            }
        };
        fetchData();
    }, []);

    // --- Data Transformation ---
    const dateString = format(new Date(), "yyyy-MM-dd");
    const allActivities = reports.map((report) => {
        const classInfo = classes.find((c) => c.id === report.class_id);
        const className = classInfo ? `${classInfo.name} - ${classInfo.section}` : "Unknown Class";
        return {
            id: report.id,
            date: format(new Date(report.created_at), "yyyy-MM-dd"),
            period: report.period,
            class: className,
            subject: report.subject_name,
            description: report.activity,
            teacherId: report.teacher_id,
            teacherName: report.teacher,
            isApproved: report.approved,
            isRejected: report.rejected || false,
            sentForApproval: !report.approved && !(report.rejected || false),
            createdAt: report.created_at,
        };
    });

    const pendingActivities = allActivities.filter((a) => a.sentForApproval);
    const todayActivities = allActivities.filter(a => a.date === dateString);

    // --- Component Functions ---
    const getTeacherPendingCount = (teacherId) => {
        return pendingActivities.filter((activity) => activity.teacherId === teacherId).length;
    };
    
    const handleTeacherClick = (teacherId) => {
        const teacherPending = pendingActivities.filter((activity) => activity.teacherId === teacherId);
        setSelectedTeacherPending(teacherPending);
        setIsPendingDialogOpen(true);
    };

    const handleApprove = (activityId) => {
        approveActivity(activityId, user?.name || "Principal");
        // Optimistically update UI
        const updatedPending = selectedTeacherPending.filter((activity) => activity.id !== activityId);
        setSelectedTeacherPending(updatedPending);
        const updatedReports = reports.filter(report => report.id !== activityId);
        setReports(updatedReports);
        toast({ title: "Activity Approved", description: "The activity has been approved successfully." });
    };

    const handleReject = (activityId, reason = "Not specified") => {
        rejectActivity(activityId, user?.name || "Principal", reason);
        // Optimistically update UI
        const updatedPending = selectedTeacherPending.filter((activity) => activity.id !== activityId);
        setSelectedTeacherPending(updatedPending);
        const updatedReports = reports.filter(report => report.id !== activityId);
        setReports(updatedReports);
        toast({ title: "Activity Rejected", description: "The activity has been rejected.", variant: "destructive" });
    };

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
                        {pendingActivities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="apple-card p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Badge variant="outline" className="text-xs">Period {activity.period}</Badge>
                                            <Badge className="text-xs bg-blue-100 text-blue-800 border-0">{activity.class}</Badge>
                                            <Badge className="text-xs bg-green-100 text-green-800 border-0">{activity.subject}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(activity.createdAt), "MMM d, yyyy")} • {activity.teacherName}</p>
                                    </div>
                                    <div className="flex space-x-3 ml-4">
                                        <Button size="sm" onClick={() => handleApprove(activity.id)} className="apple-button theme-primary text-white border-0 hover:scale-105">
                                            <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleReject(activity.id)} className="apple-button bg-red-500 text-white border-0 hover:bg-red-600 hover:scale-105">
                                            <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                        {teachers.sort((a, b) => {
                            const aPendingCount = getTeacherPendingCount(a.id);
                            const bPendingCount = getTeacherPendingCount(b.id);
                            if (aPendingCount !== bPendingCount) return bPendingCount - aPendingCount;
                            return a.name.localeCompare(b.name);
                        }).map((teacher) => {
                            const pendingCount = getTeacherPendingCount(teacher.id);
                            return (
                                <div key={teacher.id} onClick={() => pendingCount > 0 && handleTeacherClick(teacher.id)} className={`p-4 rounded-xl border-0 minimal-shadow transition-all duration-200 ${pendingCount > 0 ? "bg-amber-50 cursor-pointer hover:scale-[1.02]" : "bg-gray-50"}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center minimal-shadow"><User className="h-5 w-5 text-blue-600" /></div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{teacher.name}</h4>
                                                <p className="text-sm text-gray-600">{teacher.department}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {pendingCount > 0 && (<Badge className="bg-amber-100 text-amber-800 border-0">{pendingCount} pending</Badge>)}
                                            <Badge variant="outline" className="text-xs">ID: {teacher.teacherId}</Badge>
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
                        <div className="text-2xl font-bold theme-text">{teachers.length}</div>
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
                        <div className="text-2xl font-bold text-blue-700">{todayActivities.length}</div>
                        <div className="text-sm text-gray-600">Today</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Approvals Dialog */}
            <Dialog open={isPendingDialogOpen} onOpenChange={setIsPendingDialogOpen}>
                <DialogContent className="w-full max-w-2xl mx-auto rounded-2xl border-0 minimal-shadow-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="text-center pb-4">
                        <DialogTitle className="flex items-center justify-center space-x-2 text-xl">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Shield className="h-4 w-4 text-amber-600" /></div>
                            <span>Pending Approvals</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedTeacherPending.map((activity) => (
                            <div key={activity.id} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Badge variant="outline" className="text-xs">Period {activity.period}</Badge>
                                            <Badge className="text-xs bg-blue-100 text-blue-800 border-0">{activity.class}</Badge>
                                            <Badge className="text-xs bg-green-100 text-green-800 border-0">{activity.subject}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(activity.createdAt), "MMM d, yyyy")} • {activity.teacherName}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button size="sm" onClick={() => handleApprove(activity.id)} className="theme-primary rounded-lg flex-1"><Check className="h-4 w-4 mr-1" />Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleReject(activity.id)} className="rounded-lg flex-1"><X className="h-4 w-4 mr-1" />Reject</Button>
                                </div>
                            </div>
                        ))}
                        {selectedTeacherPending.length === 0 && (<div className="text-center py-8 text-gray-500">No pending activities for this teacher</div>)}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PrincipalView;