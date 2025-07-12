import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner"; // Fixed: Using sonner instead of use-toast
import { Loader2, GraduationCap } from "lucide-react";
import { baseURL } from "../../utils/axios";
import axios from "axios";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/redux/authSlice';
import { Navigate, useNavigate } from "react-router-dom";

const LoginScreen = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false); 
    const navigate = useNavigate()

    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Added: Prevent form submission
        
        try {
            setLoading(true);

            const response = await axios.post(`${baseURL}/login/`, {
                username,
                password,
            });

            console.log(response.data);

            if (response.data) {
                // Dispatch login success action to Redux store
                dispatch(
                    loginSuccess({
                        accessToken:
                            response.data.access_token ||
                            response.data.accessToken,
                        refreshToken:
                            response.data.refresh_token ||
                            response.data.refreshToken,
                        user: response.data.user || response.data.userData,
                    })
                );

                // Show success toast
                toast.success("Login successful!", {
                    description:
                        "Welcome back! You have been successfully logged in.",
                    duration: 3000,
                });
                if(response.data.user.must_change_password === true){
                  navigate("/change-password/")
                }else{
                  navigate("/")
                }

                // Navigation will happen automatically due to conditional rendering in Index.jsx
            }
        } catch (error) {
            console.error("Login error:", error);

            // Handle different error scenarios
            if (error.response) {
                // Server responded with error status
                const errorMessage =
                    error.response.data?.message || "Login failed";
                console.error("Login failed:", errorMessage);

                // Show error toast
                toast.error("Login failed", {
                    description: errorMessage,
                    duration: 4000,
                });
            } else if (error.request) {
                // Request was made but no response received
                console.error("Network error - no response received");
                toast.error("Network error", {
                    description:
                        "Please check your internet connection and try again.",
                    duration: 4000,
                });
            } else {
                // Something else happened
                console.error("Error:", error.message);
                toast.error("Error", {
                    description:
                        "An unexpected error occurred. Please try again.",
                    duration: 4000,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto bg-blue-600 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            School Reporter
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Sign in to manage your classroom activities
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginScreen;