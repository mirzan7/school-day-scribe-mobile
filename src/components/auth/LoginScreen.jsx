import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, User, Shield } from 'lucide-react';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('teacher');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const success = await login(email, password);
    if (!success) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Check demo credentials below.",
        variant: "destructive"
      });
    }
  };

  const setDemoCredentials = (role) => {
    setSelectedRole(role);
    if (role === 'teacher') {
      setEmail('teacher@school.edu');
      setPassword('password123');
    } else {
      setEmail('principal@school.edu');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 minimal-shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto theme-primary rounded-2xl p-4 w-20 h-20 flex items-center justify-center minimal-shadow">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">School Reporter</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to manage classroom activities
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-gray-200"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 theme-primary rounded-xl font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 text-center">Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setDemoCredentials('teacher')}
                className={`h-16 rounded-xl border-2 transition-all ${
                  selectedRole === 'teacher' 
                    ? 'theme-border theme-primary-light' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <User className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Teacher</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setDemoCredentials('principal')}
                className={`h-16 rounded-xl border-2 transition-all ${
                  selectedRole === 'principal' 
                    ? 'theme-border theme-primary-light' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <Shield className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">Principal</div>
                </div>
              </Button>
            </div>
            <div className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg p-3">
              <p className="font-medium mb-1">Selected: {selectedRole === 'teacher' ? 'Teacher Account' : 'Principal Account'}</p>
              <p>Email: {selectedRole === 'teacher' ? 'teacher@school.edu' : 'principal@school.edu'}</p>
              <p>Password: password123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;