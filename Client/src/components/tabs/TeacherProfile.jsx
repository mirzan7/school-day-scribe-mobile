import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import api from "../../utils/axios";

const TeacherProfile = ({ user, handleLogout }) => {
    const [classTaught, setClassTaught] = useState(0);
    const handleChangePassword = () => {
        toast({
            title: "Backend Required",
            description:
                "Connect to Supabase to enable password changes and user management",
            variant: "destructive",
        });
    };

    const handleChangeAvatar = () => {
        toast({
            title: "Backend Required",
            description:
                "Connect to Supabase to enable avatar uploads and file storage",
            variant: "destructive",
        });
    };

    const fetchData = async () => {
        try {
          
            const response = await api.get("/profile/");
            setClassTaught(response.data.count);
        } catch (error) {
          console.log(error);
          
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const initials = user.username
        .split(" ")
        .map((n) => n[0])
        .join("");

    return (
        <div className="p-4 space-y-6 pb-32">
            <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 mb-4">
                    <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Profile
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your account and preferences
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
                            <Badge className="bg-blue-100 text-blue-800 border-0">
                                Teacher
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

            <div className="grid gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                            <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                            Teacher Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">Role</span>
                            <span className="font-medium text-foreground capitalize">
                                {user.role}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">
                                Department
                            </span>
                            <span className="font-medium text-foreground">
                                {user.department}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">
                                Employee ID
                            </span>
                            <span className="font-medium text-foreground">
                                {user.teacher_id}
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
                            This week's activities
                        </p>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {classTaught || 0}
                            </div>
                            <div className="text-sm text-primary/80 font-medium">
                                Classes Taught
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

export default TeacherProfile;
