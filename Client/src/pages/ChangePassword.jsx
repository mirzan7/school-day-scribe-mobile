import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { useAuth } from "../hooks/useAuth";
import { useDispatch } from 'react-redux';
import { passwordChanged } from '../redux/authSlice';

const ChangePasswordScreen = () => {
    const { user, accessToken } = useAuth();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch  = useDispatch();

    // Effect to check if password change is required
    useEffect(() => {
        if (user) {
            // If user is NOT required to change password, redirect them
            if(user.role == "principal"){
                
            }
            else if (!user.must_change_password) {
                toast.info("Redirecting...", {
                    description: "You are not required to change your password.",
                    duration: 3000,
                });
                navigate("/"); // Redirect to the home page
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match", {
                description: "Your new password and confirmation password must be the same.",
                duration: 4000,
            });
            return;
        }

        if (!accessToken) {
            toast.error("Authentication Error", {
                description: "You are not logged in.",
                duration: 4000,
            });
            navigate('/login');
            return;
        }

        setLoading(true);

        try {
            // The payload no longer includes the old password.
            // Ensure your backend endpoint supports this.
            const response = await api.post(
                `/change-password/`,
                {
                    new_password: newPassword, // Only sending the new password
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if(response.status == 200){
                toast.success("Password changed successfully!", {
                description: "You can now use your new password.",
                duration: 3000,
            });
            dispatch(passwordChanged());

            navigate("/");
            }

            

        } catch (error) {
            console.error("Change password error:", error);
            const errorMessage =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "An error occurred while changing your password.";

            toast.error("Failed to change password", {
                description: errorMessage,
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Optional: Show a loading state while waiting for user data
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto bg-blue-600 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                        <KeyRound className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Create a New Password
                        </CardTitle>
                        {user.must_change_password && (
                             <CardDescription className="text-orange-600 font-semibold mt-2">
                                For your security, you must set a new password to continue.
                            </CardDescription>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter your new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    Saving Password...
                                </>
                            ) : (
                                "Save New Password"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChangePasswordScreen;