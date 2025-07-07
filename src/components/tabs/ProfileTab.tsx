
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, LogOut, GraduationCap, BookOpen } from 'lucide-react';

const ProfileTab = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile</h2>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-20 h-20 mb-4">
              <AvatarFallback className="text-xl bg-blue-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h3>
            <p className="text-gray-600 flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {user.email}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
              Teacher Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Role</span>
              <span className="font-medium">Teacher</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Department</span>
              <span className="font-medium">General Education</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Employee ID</span>
              <span className="font-medium">T001</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">This week's activities</p>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-green-700">Classes Taught</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-200">
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
        <p className="text-xs text-gray-500">
          School Reporter v1.0.0
        </p>
      </div>
    </div>
  );
};

export default ProfileTab;
