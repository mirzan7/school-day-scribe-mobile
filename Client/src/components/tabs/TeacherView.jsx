import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
    Plus,
    Clock,
    BookOpen,
    Calendar as CalendarIcon,
    ChevronRight,
    CheckCircle2,
    Send,
    PlusCircle,
    Camera,
    X,
    RefreshCw,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import api from "../../utils/axios";

const TeacherView = ({ addActivity }) => {
    // State for API data
    const [reports, setReports] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Other component state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [isCustomClass, setIsCustomClass] = useState(false);
    const [isCustomSubject, setIsCustomSubject] = useState(false);
    const [existingHomework, setExistingHomework] = useState([]);
    const [inputType, setInputType] = useState("description");
    const [photoFile, setPhotoFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [editingReportId, setEditingReportId] = useState(null);

    // Homework count state
    const [homeworkCount, setHomeworkCount] = useState(null);
    const [isLoadingHomeworkCount, setIsLoadingHomeworkCount] = useState(false);

    // Auto-refresh state
    const intervalRef = useRef(null);
    const isAddingReportRef = useRef(false);

    const [formData, setFormData] = useState({
        class: "",
        subject: "",
        description: "",
        customClass: "",
        customSubject: "",
        hasHomework: false,
        homeworkDescription: "",
    });

    // Update ref when dialog is open (teacher is adding/editing report)
    useEffect(() => {
        isAddingReportRef.current = isDialogOpen;
    }, [isDialogOpen]);

    const fetchData = async (showToast = false) => {
        try {
            // Don't fetch if teacher is adding/editing a report
            if (isAddingReportRef.current) {
                console.log("Skipping API call - teacher is adding/editing a report");
                return;
            }

            const response = await api.get("/teacher-report/");
            setReports(response.data.reports || []);
            setSubjects(response.data.subjects || []);
            setClasses(response.data.classes || []);
            setLastUpdated(new Date());
            
            if (showToast) {
                toast({
                    title: "Schedule Updated",
                    description: "Your schedule has been refreshed.",
                });
            }
        } catch (error) {
            console.error("Failed to fetch teacher data:", error);
            if (showToast) {
                toast({
                    title: "Error",
                    description: "Could not refresh schedule.",
                    variant: "destructive",
                });
            }
        }
    };

    // Fetch homework count for a specific class
    const fetchHomeworkCount = async (classId) => {
        setIsLoadingHomeworkCount(true);
        try {
            // Assuming you have an endpoint that returns homework count for a class
            const response = await api.get(`/homework/count/${classId}/`);
            setHomeworkCount(response.data);
        } catch (error) {
            console.error("Failed to fetch homework count:", error);
            toast({
                title: "Error",
                description: "Could not fetch homework count.",
                variant: "destructive",
            });
            setHomeworkCount(null);
        } finally {
            setIsLoadingHomeworkCount(false);
        }
    };

    const startAutoRefresh = () => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Only start if not adding a report
        if (!isAddingReportRef.current) {
            // Set up new interval for 5 minutes (300000 ms)
            intervalRef.current = setInterval(() => {
                // Double-check before making API call
                if (!isAddingReportRef.current) {
                    fetchData(true); // Show toast for auto-refresh
                }
            }, 300000);
            console.log("Auto-refresh started - will refresh every 5 minutes");
        }
    };

    const stopAutoRefresh = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log("Auto-refresh stopped");
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();
        
        // Start auto-refresh
        startAutoRefresh();

        // Cleanup on unmount
        return () => {
            stopAutoRefresh();
        };
    }, []);

    // Pause/resume auto-refresh based on dialog state
    useEffect(() => {
        if (isDialogOpen) {
            console.log("Pausing auto-refresh - teacher is adding/editing a report");
            stopAutoRefresh();
        } else {
            console.log("Resuming auto-refresh - teacher finished adding/editing report");
            startAutoRefresh();
        }
    }, [isDialogOpen]);

    // Manual refresh function
    const handleManualRefresh = () => {
        fetchData(true);
    };

    // Handle homework toggle
    const handleHomeworkToggle = (checked) => {
        setFormData((prev) => ({
            ...prev,
            hasHomework: checked,
        }));

        // If homework is enabled and we have a class selected, fetch homework count
        if (checked) {
            const selectedClass = isCustomClass ? formData.customClass : formData.class;
            const classObj = classes.find((c) => c.name === selectedClass);
            
            if (classObj) {
                fetchHomeworkCount(classObj.id);
            }
        } else {
            // Clear homework count when homework is disabled
            setHomeworkCount(null);
        }
    };

    // Handle class selection change
    const handleClassChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            class: value,
        }));

        // If homework is enabled, fetch homework count for the new class
        if (formData.hasHomework) {
            const classObj = classes.find((c) => c.name === value);
            if (classObj) {
                fetchHomeworkCount(classObj.id);
            }
        }
    };

    // Handle custom class change
    const handleCustomClassChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            customClass: value,
        }));

        // For custom classes, we might not have homework count data
        if (formData.hasHomework) {
            setHomeworkCount(null);
        }
    };

    // --- Data Transformation ---
    const dateString = format(new Date(), "yyyy-MM-dd");
    const allClasses = classes.map((c) => `${c.name}`);
    const allSubjects = subjects.map((s) => s.name);

    const allActivities = reports.map((report) => {
        return {
            id: report.id,
            date: format(new Date(report.created_at), "yyyy-MM-dd"),
            period: report.period,
            class: report.class_assigned_name,
            subject: report.subject_name,
            description: report.activity,
            hasHomework: !!report.homework_title, 
            homeworkDescription: report.homework_title || "",
            status : report.status,
            approvedBy: report.approved ? "Principal" : null,
            rejectedBy: report.rejected ? "Principal" : null,
            inputType: "description",
            photoURL: "",
        };
    });
    const todayActivities = allActivities.filter((a) => a.date === dateString);

    // --- Component Functions ---
    const periods = Array.from({ length: 8 }, (_, i) => i + 1);

    const getPeriodActivity = (period) =>
        todayActivities.find((activity) => activity.period === period);

    const getStatusColor = (activity) => {
        if (!activity) return "bg-gray-50 border-gray-200";
        if (activity.status === "approved") return "theme-primary-light theme-border";
        if (activity.status === "rejected") return "bg-red-50 border-red-200";
        if (activity.status === "pending") return "bg-amber-50 border-amber-200";
        return "bg-blue-50 border-blue-200";
    };

    const getStatusIcon = (activity) => {
        if (!activity) return <Plus className="h-5 w-5 text-gray-400" />;
        if (activity.status === "approved")
            return <CheckCircle2 className="h-5 w-5 theme-text" />;
        if (activity.status === "rejected") return <X className="h-5 w-5 text-red-600" />;
        if (activity.status === "pending")
            return <Send className="h-5 w-5 text-amber-600" />;
        return <Clock className="h-5 w-5 text-blue-600" />;
    };

    const resetFormState = () => {
        setFormData({
            class: "",
            subject: "",
            description: "",
            customClass: "",
            customSubject: "",
            hasHomework: false,
            homeworkDescription: "",
        });
        setIsCustomClass(false);
        setIsCustomSubject(false);
        setInputType("description");
        setPhotoFile(null);
        setImagePreview(null);
        setExistingHomework([]);
        setEditingReportId(null);
        setHomeworkCount(null); // Reset homework count
    };

    const handleAddActivity = (period) => {
        const existingActivity = getPeriodActivity(period);
        resetFormState(); // Reset form state first

        if (existingActivity) {
            // This is an existing activity, populate form and set editing ID
            setEditingReportId(existingActivity.id);
            setFormData({
                class: existingActivity.class || "",
                subject: existingActivity.subject || "",
                description: existingActivity.description || "",
                customClass: "",
                customSubject: "",
                hasHomework: existingActivity.hasHomework || false,
                homeworkDescription: existingActivity.homeworkDescription || "",
            });
            setIsCustomClass(!allClasses.includes(existingActivity.class));
            setIsCustomSubject(!allSubjects.includes(existingActivity.subject));

            // If existing activity has homework, fetch homework count
            if (existingActivity.hasHomework) {
                const classObj = classes.find((c) => c.name === existingActivity.class);
                if (classObj) {
                    fetchHomeworkCount(classObj.id);
                }
            }
        }
        
        setSelectedPeriod(period);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalClass = isCustomClass
            ? formData.customClass.trim()
            : formData.class;
        const finalSubject = isCustomSubject
            ? formData.customSubject.trim()
            : formData.subject;

        if (!selectedPeriod || !finalClass || !finalSubject) {
            toast({
                title: "Missing Information",
                description: "Please select a class and subject.",
                variant: "destructive",
            });
            return;
        }

        const classObj = classes.find((c) => c.name === finalClass);
        const subjectObj = subjects.find((s) => s.name === finalSubject);

        if (!classObj || !subjectObj) {
            toast({
                title: "Invalid Selection",
                description: "The selected class or subject is not valid.",
                variant: "destructive",
            });
            return;
        }

        // Check homework limit before submitting
        if (formData.hasHomework && homeworkCount) {
            if (homeworkCount.current_count >= homeworkCount.limit) {
                toast({
                    title: "Homework Limit Reached",
                    description: `Cannot assign more homework. Daily limit (${homeworkCount.limit}) has been reached for this class.`,
                    variant: "destructive",
                });
                return;
            }
        }

        const reportData = {
            period: selectedPeriod,
            class_assigned_id: classObj.id,
            subject_id: subjectObj.id,
            activity: formData.description.trim(),
            homework_description: formData.hasHomework
                ? formData.homeworkDescription.trim()
                : null,
        };

        try {
            let response;
            if (editingReportId) {
                // We are UPDATING an existing report
                response = await api.put(
                    `/teacher-report/${editingReportId}/`,
                    reportData
                );
                // Update the specific report in the state
                setReports(prevReports => 
                    prevReports.map(report => 
                        report.id === editingReportId ? response.data : report
                    )
                );
                toast({
                    title: "Success",
                    description: "Your report has been updated and sent for approval.",
                });

            } else {
                // We are CREATING a new report
                response = await api.post(
                    "/teacher-report/create/",
                    reportData
                );
                // Add the new report to the state
                setReports(prevReports => [...prevReports, response.data]);
                toast({
                    title: "Success",
                    description: "Your report has been submitted for approval.",
                });
            }

            setIsDialogOpen(false);
            resetFormState();
        } catch (error) {
            console.error("Failed to submit report:", error);
            toast({
                title: "Error",
                description:
                    error.response?.data?.error ||
                    "Could not submit your report.",
                variant: "destructive",
            });
        }
    };

    const formatLastUpdated = (date) => {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // Render homework count badge
    const renderHomeworkCount = () => {
        if (!formData.hasHomework) return null;

        if (isLoadingHomeworkCount) {
            return (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    <span>Loading homework count...</span>
                </div>
            );
        }

        if (!homeworkCount) {
            return (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>Unable to fetch homework count</span>
                </div>
            );
        }

        const { current_count, limit } = homeworkCount;
        const isAtLimit = current_count >= limit;

        return (
            <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                isAtLimit ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
                {isAtLimit ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className={`text-sm font-medium ${
                    isAtLimit ? 'text-red-700' : 'text-green-700'
                }`}>
                    Homework: {current_count}/{limit}
                </span>
                {isAtLimit && (
                    <span className="text-xs text-red-600">
                        (Daily limit reached)
                    </span>
                )}
            </div>
        );
    };
    
    return (
        <div className="p-6 space-y-6 pb-32 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Today's Schedule
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleManualRefresh}
                        disabled={isDialogOpen}
                        className="p-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 rounded-xl border border-gray-200">
                        <CalendarIcon className="h-4 w-4 theme-text" />
                        <span className="font-medium text-gray-900">
                            {format(new Date(), "EEEE, MMM d, yyyy")}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Last updated: {formatLastUpdated(lastUpdated)}
                        {isDialogOpen && (
                            <span className="ml-2 text-yellow-600 font-medium">
                                (Auto-refresh paused)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Indicator */}
            {todayActivities.length > 0 && (
                <Card className="theme-bg-light border-0 minimal-shadow animate-slide-up">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium theme-text">
                                Daily Progress
                            </span>
                            <span className="text-sm theme-text">
                                {todayActivities.length}/8 periods
                            </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                            <div
                                className="theme-primary h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${
                                        (todayActivities.length / 8) * 100
                                    }%`,
                                }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Period Cards */}
            <div className="grid gap-4 animate-slide-up">
                {periods.map((period) => {
                    const activity = getPeriodActivity(period);
                    return (
                        <Card
                            key={period}
                            className={`transition-all duration-200 hover:scale-[1.02] cursor-pointer border-0 minimal-shadow-lg ${getStatusColor(
                                activity
                            )}`}
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
                                                <h3 className="font-semibold text-gray-900">
                                                    Period {period}
                                                </h3>
                                                {activity?.status == "approved" && (
                                                    <div className="w-2 h-2 theme-primary rounded-full"></div>
                                                )}
                                            </div>
                                            {activity ? (
                                                <div className="space-y-1">
                                                    <p className="font-medium text-gray-700">
                                                        {activity.class} •{" "}
                                                        {activity.subject}
                                                    </p>
                                                    {activity.inputType ===
                                                    "photo" ? (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Camera className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                                            <span>
                                                                Photo attached
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-600 line-clamp-1">
                                                            {
                                                                activity.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">
                                                    Tap to add activity
                                                </p>
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
                        {/* Class & Section Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-gray-700">
                                    Class & Section
                                </Label>
                            </div>
                            {isCustomClass ? (
                                <Input
                                    placeholder="Enter new class (e.g., 11-Science-A)"
                                    value={formData.customClass}
                                    onChange={(e) => handleCustomClassChange(e.target.value)}
                                    className="rounded-xl border-gray-200 h-12"
                                />
                            ) : (
                                <Select
                                    value={formData.class}
                                    onValueChange={handleClassChange}
                                >
                                    <SelectTrigger className="rounded-xl border-gray-200 h-12">
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {allClasses.map((cls) => (
                                            <SelectItem
                                                key={cls}
                                                value={cls}
                                                className="rounded-lg"
                                            >
                                                {cls}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {/* Subject Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-gray-700">
                                    Subject
                                </Label>
                            </div>
                            {isCustomSubject ? (
                                <Input
                                    placeholder="Enter new subject"
                                    value={formData.customSubject}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            customSubject: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl border-gray-200 h-12"
                                />
                            ) : (
                                <Select
                                    value={formData.subject}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            subject: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="rounded-xl border-gray-200 h-12">
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {allSubjects.map((subject) => (
                                            <SelectItem
                                                key={subject}
                                                value={subject}
                                                className="rounded-lg"
                                            >
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {/* Activity Details, Homework, and Buttons */}
                        <div className="space-y-2">
                            <Label>Activity Details</Label>
                        </div>
                        <div className="space-y-2 animate-fade-in">
                            <Textarea
                                placeholder="Describe the work done..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                                <Label
                                    htmlFor="homework-switch"
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                    Homework Assigned?
                                </Label>
                                <Switch
                                    id="homework-switch"
                                    checked={formData.hasHomework}
                                    onCheckedChange={handleHomeworkToggle}
                                />
                            </div>
                        </div>
                        
                        {/* Homework Count Display */}
                        {renderHomeworkCount()}
                        
                        {formData.hasHomework && (
                            <div className="space-y-2 animate-fade-in">
                                <Label className="text-sm font-medium text-gray-700">
                                    Homework Details
                                </Label>
                                <Textarea
                                    placeholder="What is the homework assignment?"
                                    value={formData.homeworkDescription}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            homeworkDescription: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    className="rounded-xl border-gray-200 resize-none"
                                />
                            </div>
                        )}
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
                                disabled={formData.hasHomework && homeworkCount?.current_count >= homeworkCount?.limit}
                            >
                                {editingReportId ? "Update Report" : "Send for Approval"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeacherView;