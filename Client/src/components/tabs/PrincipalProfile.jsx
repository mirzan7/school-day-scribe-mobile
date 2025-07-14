import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    User,
    Mail,
    LogOut,
    GraduationCap,
    BookOpen,
    Lock,
    Camera,
    Settings,
    Plus,
    UserPlus,
    Shield,
    Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axios from "axios"; // Import axios directly
import { useNavigate } from "react-router-dom";

// FIX: The original import for 'api' could not be resolved.
// A local axios instance is created here as a replacement.
// You may need to configure this with your actual backend base URL and authentication headers.
const api = axios.create({
    baseURL: "/api", // IMPORTANT: Replace with your actual API base URL
});


const PrincipalProfile = ({ user, handleLogout }) => {
    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [teacherForm, setTeacherForm] = useState({
        name: "",
        teacherId: "",
        department: "",
        role: "teacher",
        phone: "",
    });
    const navigate = useNavigate();

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/profile/'); // This now uses the local 'api' instance
            console.log(response.data);

            // Transform the backend data to match the expected format
            const transformedTeachers = response.data.map(teacher => ({
                id: teacher.teacher_id,
                name: teacher.user.username,
                email: teacher.email || `${teacher.user.username.toLowerCase()}@school.edu`,
                teacherId: teacher.teacher_id,
                department: teacher.department,
                role: teacher.role,
                phone: teacher.phone,
                created_at: teacher.created_at
            }));

            setTeachers(transformedTeachers);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            toast({
                title: "Error",
                description: "Failed to load teachers data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleChangePassword = () => {
        // Navigate to the change password page
        navigate("/change-password");
    };

    

    const handleChangeAvatar = () => {
        toast({
            title: "Feature Not Available",
            description:
                "Changing your profile photo is not yet implemented.",
            variant: "destructive",
        });
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();

        if (
            !teacherForm.name ||
            !teacherForm.teacherId ||
            !teacherForm.department
        ) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        // Check for duplicate teacher ID
        if (teachers.some(teacher => teacher.teacherId === teacherForm.teacherId)) {
            toast({
                title: "Teacher ID Exists",
                description: "This teacher ID is already in use",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);

            // Make API call to add teacher
            const response = await api.post('/create/teacher/', teacherForm);
            console.log(response.data);


            toast({
                title: "Teacher Added",
                description: `${teacherForm.name} has been added successfully`,
            });

            // Refresh the teachers list
            await fetchTeachers();

            // Reset form and close dialog
            setIsAddTeacherOpen(false);
            setTeacherForm({
                name: "",
                teacherId: "",
                department: "",
                role: "teacher",
                phone: "",
            });
        } catch (error) {
            console.error('Error adding teacher:', error);
            toast({
                title: "Error",
                description: "Failed to add teacher. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const initials = user.username
        ? user.username
            .split(" ")
            .map((n) => n[0])
            .join("")
        : "P";

    return (
        <div className="p-4 space-y-6 pb-32">
            <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 mb-4">
                    <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Principal Profile
                    </h2>
                    <p className="text-muted-foreground">
                        Manage staff and school-wide settings
                    </p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <Avatar className="w-24 h-24">
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                size="sm"
                                variant="outline"
                                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                                onClick={handleChangeAvatar}
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                            {user.name}
                        </h3>
                        <p className="text-muted-foreground flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {user.email}
                        </p>
                        <div className="mt-2">
                            <Badge className="bg-purple-100 text-purple-800 border-0">
                                Principal
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-primary" />
                        Account Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleChangePassword}
                    >
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleChangeAvatar}
                    >
                        <Camera className="h-4 w-4 mr-2" />
                        Change Profile Photo
                    </Button>
                </CardContent>
            </Card>

            {/* Staff Management */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <UserPlus className="h-5 w-5 mr-2 text-primary" />
                            Staff Management
                        </div>
                        <Button
                            size="sm"
                            onClick={() => setIsAddTeacherOpen(true)}
                            className="theme-primary"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Teacher
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600 mb-3">
                        Total Teachers: {teachers.length}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="ml-2 text-sm text-gray-600">Loading teachers...</span>
                            </div>
                        ) : teachers.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">
                                <UserPlus className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No teachers added yet</p>
                                <p className="text-xs text-gray-400 mt-1">Click "Add Teacher" to get started</p>
                            </div>
                        ) : (
                            teachers.map((teacher) => (
                                <div
                                    key={teacher.id || teacher.teacherId}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {teacher.name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {teacher.department}
                                        </p>
                                        {teacher.phone && (
                                            <p className="text-xs text-gray-500">
                                                Phone: {teacher.phone}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            ID: {teacher.teacherId}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {teacher.role}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Teacher Dialog */}
            <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
                <DialogContent className="w-full max-w-md mx-auto rounded-2xl border-0 minimal-shadow-lg">
                    <DialogHeader className="text-center pb-4">
                        <DialogTitle className="flex items-center justify-center space-x-2 text-xl">
                            <div className="w-8 h-8 theme-primary rounded-lg flex items-center justify-center">
                                <UserPlus className="h-4 w-4 text-white" />
                            </div>
                            <span>Add New Teacher</span>
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddTeacher} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Full Name
                            </Label>
                            <Input
                                placeholder="Enter teacher's full name"
                                value={teacherForm.name}
                                onChange={(e) =>
                                    setTeacherForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                className="rounded-xl border-gray-200 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Phone Number
                            </Label>
                            <Input
                                placeholder="Enter teacher's phone number"
                                value={teacherForm.phone}
                                onChange={(e) =>
                                    setTeacherForm((prev) => ({
                                        ...prev,
                                        phone: e.target.value,
                                    }))
                                }
                                className="rounded-xl border-gray-200 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Teacher ID
                            </Label>
                            <Input
                                placeholder="T001, T002, etc."
                                value={teacherForm.teacherId}
                                onChange={(e) =>
                                    setTeacherForm((prev) => ({
                                        ...prev,
                                        teacherId: e.target.value,
                                    }))
                                }
                                className="rounded-xl border-gray-200 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Department
                            </Label>
                            <Select
                                value={teacherForm.department}
                                onValueChange={(value) =>
                                    setTeacherForm((prev) => ({
                                        ...prev,
                                        department: value,
                                    }))
                                }
                            >
                                <SelectTrigger className="rounded-xl border-gray-200 h-12">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="Mathematics" className="rounded-lg">
                                        Mathematics
                                    </SelectItem>
                                    <SelectItem value="Science" className="rounded-lg">
                                        Science
                                    </SelectItem>
                                    <SelectItem value="English" className="rounded-lg">
                                        English
                                    </SelectItem>
                                    <SelectItem value="History" className="rounded-lg">
                                        History
                                    </SelectItem>
                                    <SelectItem value="Geography" className="rounded-lg">
                                        Geography
                                    </SelectItem>
                                    <SelectItem value="Physical Education" className="rounded-lg">
                                        Physical Education
                                    </SelectItem>
                                    <SelectItem value="Arts" className="rounded-lg">
                                        Arts
                                    </SelectItem>
                                    <SelectItem value="Computer Science" className="rounded-lg">
                                        Computer Science
                                    </SelectItem>
                                    <SelectItem value="General Education" className="rounded-lg">
                                        General Education
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Role
                            </Label>
                            <Select
                                value={teacherForm.role}
                                onValueChange={(value) =>
                                    setTeacherForm((prev) => ({
                                        ...prev,
                                        role: value,
                                    }))
                                }
                            >
                                <SelectTrigger className="rounded-xl border-gray-200 h-12">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="teacher" className="rounded-lg">
                                        Teacher
                                    </SelectItem>
                                    <SelectItem value="senior_teacher" className="rounded-lg">
                                        Senior Teacher
                                    </SelectItem>
                                    <SelectItem value="head_of_department" className="rounded-lg">
                                        Head of Department
                                    </SelectItem>
                                    <SelectItem value="vice_principal" className="rounded-lg">
                                        Vice Principal
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddTeacherOpen(false)}
                                className="flex-1 rounded-xl border-gray-200 h-12"
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 theme-primary rounded-xl h-12 font-medium"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Teacher"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                            <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                            Principal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Role</span>
                            <span className="font-medium text-foreground capitalize">
                                {user.role}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">
                                Department
                            </span>
                            <span className="font-medium text-foreground">
                                Administration
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">
                                Employee ID
                            </span>
                            <span className="font-medium text-foreground">
                                P001
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                            <BookOpen className="h-5 w-5 mr-2 text-primary" />
                            Quick Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            School-wide statistics
                        </p>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {teachers.length}
                            </div>
                            <div className="text-sm text-primary/80 font-medium">
                                Teachers Managed
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-destructive/20 shadow-sm">
                <CardContent className="p-4">
                    <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full flex items-center justify-center"
                        size="lg"
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        Log Out
                    </Button>
                </CardContent>
            </Card>

            <div className="text-center pt-4">
                <p className="text-xs text-muted-foreground">
                    School Reporter v1.0.0
                </p>
            </div>
        </div>
    );
};

export default PrincipalProfile;
