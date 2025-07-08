import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, LogOut, GraduationCap, BookOpen, Lock, Camera, Settings, Plus, UserPlus, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ProfileTab = () => {
  const { user, logout } = useAuth();
  const { addTeacher, getAllTeachers } = useActivity();
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    teacherId: '',
    department: '',
    role: 'teacher'
  });

  const allTeachers = getAllTeachers();

  const handleLogout = () => {
    logout();
  };

  const handleChangePassword = () => {
    toast({
      title: "Backend Required",
      description: "Connect to Supabase to enable password changes and user management",
      variant: "destructive"
    });
  };

  const handleChangeAvatar = () => {
    toast({
      title: "Backend Required", 
      description: "Connect to Supabase to enable avatar uploads and file storage",
      variant: "destructive"
    });
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    
    if (!teacherForm.name || !teacherForm.email || !teacherForm.teacherId || !teacherForm.department) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Check if teacher ID already exists
    if (allTeachers.some(teacher => teacher.teacherId === teacherForm.teacherId)) {
      toast({
        title: "Teacher ID Exists",
        description: "This teacher ID is already in use",
        variant: "destructive"
      });
      return;
    }

    // Check if email already exists
    if (allTeachers.some(teacher => teacher.email === teacherForm.email)) {
      toast({
        title: "Email Exists",
        description: "This email is already in use",
        variant: "destructive"
      });
      return;
    }

    addTeacher({
      name: teacherForm.name,
      email: teacherForm.email,
      teacherId: teacherForm.teacherId,
      department: teacherForm.department,
      role: teacherForm.role
    });

    toast({
      title: "Teacher Added",
      description: `${teacherForm.name} has been added successfully`,
    });

    setIsAddTeacherOpen(false);
    setTeacherForm({
      name: '',
      email: '',
      teacherId: '',
      department: '',
      role: 'teacher'
    });
  };

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="p-4 space-y-6 pb-32">
      <div className="text-center mb-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 mb-4">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            {user.role === 'principal' ? (
              <Shield className="h-8 w-8 text-primary" />
            ) : (
              <User className="h-8 w-8 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Profile</h2>
          <p className="text-muted-foreground">Manage your account and preferences</p>
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
            <h3 className="text-xl font-semibold text-foreground mb-1">{user.name}</h3>
            <p className="text-muted-foreground flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {user.email}
            </p>
            <div className="mt-2">
              <Badge className={`${user.role === 'principal' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'} border-0`}>
                {user.role === 'principal' ? 'Principal' : 'Teacher'}
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

      {/* Principal-specific features */}
      {user.role === 'principal' && (
        <>
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
                Total Teachers: {allTeachers.length}
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {allTeachers.map(teacher => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-sm text-gray-600">{teacher.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">ID: {teacher.teacherId}</p>
                      <Badge variant="outline" className="text-xs">
                        {teacher.role}
                      </Badge>
                    </div>
                  </div>
                ))}
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
                  <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input
                    placeholder="Enter teacher's full name"
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl border-gray-200 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    type="email"
                    placeholder="teacher@school.edu"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-xl border-gray-200 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Teacher ID</Label>
                  <Input
                    placeholder="T001, T002, etc."
                    value={teacherForm.teacherId}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, teacherId: e.target.value }))}
                    className="rounded-xl border-gray-200 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <Select value={teacherForm.department} onValueChange={(value) => setTeacherForm(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger className="rounded-xl border-gray-200 h-12">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Mathematics" className="rounded-lg">Mathematics</SelectItem>
                      <SelectItem value="Science" className="rounded-lg">Science</SelectItem>
                      <SelectItem value="English" className="rounded-lg">English</SelectItem>
                      <SelectItem value="History" className="rounded-lg">History</SelectItem>
                      <SelectItem value="Geography" className="rounded-lg">Geography</SelectItem>
                      <SelectItem value="Physical Education" className="rounded-lg">Physical Education</SelectItem>
                      <SelectItem value="Arts" className="rounded-lg">Arts</SelectItem>
                      <SelectItem value="Computer Science" className="rounded-lg">Computer Science</SelectItem>
                      <SelectItem value="General Education" className="rounded-lg">General Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Role</Label>
                  <Select value={teacherForm.role} onValueChange={(value) => setTeacherForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="rounded-xl border-gray-200 h-12">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="teacher" className="rounded-lg">Teacher</SelectItem>
                      <SelectItem value="senior_teacher" className="rounded-lg">Senior Teacher</SelectItem>
                      <SelectItem value="head_of_department" className="rounded-lg">Head of Department</SelectItem>
                      <SelectItem value="vice_principal" className="rounded-lg">Vice Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddTeacherOpen(false)} 
                    className="flex-1 rounded-xl border-gray-200 h-12"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 theme-primary rounded-xl h-12 font-medium"
                  >
                    Add Teacher
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="grid gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-primary" />
              {user.role === 'principal' ? 'Principal Information' : 'Teacher Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium text-foreground capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium text-foreground">
                {user.role === 'principal' ? 'Administration' : 'General Education'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-medium text-foreground">
                {user.role === 'principal' ? 'P001' : 'T001'}
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
            <p className="text-sm text-muted-foreground mb-3">This week's activities</p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {user.role === 'principal' ? allTeachers.length : '12'}
              </div>
              <div className="text-sm text-primary/80 font-medium">
                {user.role === 'principal' ? 'Teachers Managed' : 'Classes Taught'}
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

export default ProfileTab;