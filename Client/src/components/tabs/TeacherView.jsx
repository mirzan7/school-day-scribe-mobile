import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import api from "../../utils/axios";

const TeacherView = ({ addActivity }) => {
    // State for API data
    const [reports, setReports] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);

    // Other component state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [isCustomClass, setIsCustomClass] = useState(false);
    const [isCustomSubject, setIsCustomSubject] = useState(false);
    const [existingHomework, setExistingHomework] = useState([]);
    const [inputType, setInputType] = useState("description");
    const [photoFile, setPhotoFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // FIX: Add state to track the ID of the report being edited
    const [editingReportId, setEditingReportId] = useState(null);

    const [formData, setFormData] = useState({
        class: "",
        subject: "",
        description: "",
        customClass: "",
        customSubject: "",
        hasHomework: false,
        homeworkDescription: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get("/teacher-report/");
                setReports(response.data.reports || []);
                setSubjects(response.data.subjects || []);
                setClasses(response.data.classes || []);
            } catch (error) {
                console.error("Failed to fetch teacher data:", error);
                toast({
                    title: "Error",
                    description: "Could not fetch schedule.",
                    variant: "destructive",
                });
            }
        };
        fetchData();
    }, []);

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
            isApproved: report.approved,
            isRejected: report.rejected || false,
            sentForApproval: !report.approved && !(report.rejected || false),
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
        if (activity.isApproved) return "theme-primary-light theme-border";
        if (activity.isRejected) return "bg-red-50 border-red-200";
        if (activity.sentForApproval) return "bg-amber-50 border-amber-200";
        return "bg-blue-50 border-blue-200";
    };

    const getStatusIcon = (activity) => {
        if (!activity) return <Plus className="h-5 w-5 text-gray-400" />;
        if (activity.isApproved)
            return <CheckCircle2 className="h-5 w-5 theme-text" />;
        if (activity.isRejected) return <X className="h-5 w-5 text-red-600" />;
        if (activity.sentForApproval)
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
        // FIX: Reset the editing ID
        setEditingReportId(null); 
    };

    const handleAddActivity = (period) => {
        const existingActivity = getPeriodActivity(period);
        resetFormState(); // Reset form state first

        if (existingActivity) {
            // This is an existing activity, populate form and set editing ID
            setEditingReportId(existingActivity.id); // FIX: Set the ID of the report to be edited
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
        }
        // For new activities, editingReportId is already null from resetFormState
        
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

        // This validation can be removed if custom classes/subjects are allowed and created on the fly
        if (!classObj || !subjectObj) {
            toast({
                title: "Invalid Selection",
                description: "The selected class or subject is not valid.",
                variant: "destructive",
            });
            return;
        }

        const reportData = {
            period: selectedPeriod,
            class_assigned_id: classObj.id,
            subject_id: subjectObj.id,
            activity: formData.description.trim(),
            // FIX: Changed from homework_description to match backend expectation
            homework_description: formData.hasHomework
                ? formData.homeworkDescription.trim()
                : null,
        };

        try {
            let response;
            // FIX: Check if we are editing or creating a new report
            if (editingReportId) {
                // We are UPDATING an existing report
                response = await api.put(
                    `/teacher-report/${editingReportId}/`, // Use the PUT endpoint
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
                    "/teacher-report/create/", // Use the POST endpoint
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
    
    // The rest of your JSX remains the same.
    // ... (paste your entire return statement here) ...
    return (
        <div className="p-6 space-y-6 pb-32 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900">
                    Today's Schedule
                </h2>
                <div className="text-center">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 rounded-xl border border-gray-200">
                        <CalendarIcon className="h-4 w-4 theme-text" />
                        <span className="font-medium text-gray-900">
                            {format(new Date(), "EEEE, MMM d, yyyy")}
                        </span>
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
                                                {activity?.isApproved && (
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
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            customClass: e.target.value,
                                        }))
                                    }
                                    className="rounded-xl border-gray-200 h-12"
                                />
                            ) : (
                                <Select
                                    value={formData.class}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            class: value,
                                        }))
                                    }
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
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            hasHomework: checked,
                                        }))
                                    }
                                />
                            </div>
                        </div>
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

export default TeacherView;