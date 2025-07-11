import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Users,
  Bell,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface Homework {
  id: string;
  title: string;
  description: string;
  class_assigned: {
    id: string;
    name: string;
    homework_count: number;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  due_date: string;
  assigned_date: string;
  estimated_duration: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: any;
  rejection_reason?: string;
  is_overdue: boolean;
  days_until_due: number;
}

interface Class {
  id: string;
  name: string;
  section: string;
  grade: number;
  homework_count: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface HomeworkFormData {
  title: string;
  description: string;
  class_assigned: string;
  subject: string;
  due_date: Date | undefined;
  estimated_duration: number;
  priority: string;
  instructions: string;
}

const HomeworkTab: React.FC = () => {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const [formData, setFormData] = useState<HomeworkFormData>({
    title: '',
    description: '',
    class_assigned: '',
    subject: '',
    due_date: undefined,
    estimated_duration: 30,
    priority: 'medium',
    instructions: ''
  });

  // WebSocket connection for real-time notifications
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:8000/ws/homework/notifications/`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'homework_notification') {
          setNotifications(prev => [data.notification, ...prev]);
          toast({
            title: data.notification.title,
            description: data.notification.message,
          });
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setWs(null);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchHomeworks();
    fetchClasses();
    fetchSubjects();
    fetchNotifications();
  }, [selectedClass, filterStatus]);

  const fetchHomeworks = async () => {
    try {
      setIsLoading(true);
      let url = 'http://localhost:8000/api/homeworks/';
      const params = new URLSearchParams();
      
      if (selectedClass) params.append('class_id', selectedClass);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHomeworks(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching homeworks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch homeworks",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/classes/', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/subjects/', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.class_assigned || 
        !formData.subject || !formData.due_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const homeworkData = {
        ...formData,
        due_date: formData.due_date?.toISOString(),
      };

      const response = await fetch('http://localhost:8000/api/homeworks/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(homeworkData),
      });

      if (response.ok) {
        toast({
          title: "Homework Assigned",
          description: "Homework has been sent for principal approval",
        });
        
        setIsDialogOpen(false);
        setFormData({
          title: '',
          description: '',
          class_assigned: '',
          subject: '',
          due_date: undefined,
          estimated_duration: 30,
          priority: 'medium',
          instructions: ''
        });
        
        fetchHomeworks();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.detail || "Failed to assign homework",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      toast({
        title: "Error",
        description: "Failed to assign homework",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (homeworkId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/homeworks/${homeworkId}/approve/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Homework Approved",
          description: "The homework has been approved successfully",
        });
        fetchHomeworks();
      }
    } catch (error) {
      console.error('Error approving homework:', error);
      toast({
        title: "Error",
        description: "Failed to approve homework",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (homeworkId: string, reason: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/homeworks/${homeworkId}/reject/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast({
          title: "Homework Rejected",
          description: "The homework has been rejected",
        });
        fetchHomeworks();
      }
    } catch (error) {
      console.error('Error rejecting homework:', error);
      toast({
        title: "Error",
        description: "Failed to reject homework",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHomeworks = homeworks.filter(homework => {
    const matchesSearch = homework.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         homework.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 pb-32 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 theme-primary rounded-2xl flex items-center justify-center mx-auto minimal-shadow-lg">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Homework Management</h2>
          <p className="text-gray-600">Assign and track homework for your classes</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
        <Card className="border-0 minimal-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{homeworks.length}</div>
            <div className="text-sm text-gray-600">Total Homework</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-0 minimal-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">
              {homeworks.filter(h => h.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="theme-bg-light border-0 minimal-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold theme-text">
              {homeworks.filter(h => h.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-0 minimal-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">
              {homeworks.filter(h => h.is_overdue).length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="border-0 minimal-shadow animate-slide-up">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search homework..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.homework_count} homework)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user?.role !== 'principal' && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="theme-primary rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Homework
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      <div className="space-y-4 animate-slide-up">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading homework...</p>
          </div>
        ) : filteredHomeworks.length > 0 ? (
          filteredHomeworks.map(homework => (
            <Card key={homework.id} className="border-0 minimal-shadow-lg hover:scale-[1.02] transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{homework.title}</h3>
                      <Badge className={getPriorityColor(homework.priority)}>
                        {homework.priority}
                      </Badge>
                      <Badge className={getStatusColor(homework.status)}>
                        {homework.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {homework.class_assigned.name}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {homework.subject.name}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {homework.estimated_duration} min
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Due: {format(new Date(homework.due_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{homework.description}</p>
                    
                    <div className="text-xs text-gray-500">
                      Assigned by: {homework.teacher.user.first_name} {homework.teacher.user.last_name}
                      {homework.is_overdue && (
                        <span className="text-red-600 font-medium ml-2">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {user?.role === 'principal' && homework.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(homework.id)}
                        className="theme-primary rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(homework.id, 'Not approved')}
                        className="rounded-lg"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
                
                {homework.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {homework.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 minimal-shadow">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No homework found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedClass || filterStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start by assigning homework to your classes'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assign Homework Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-2xl mx-auto rounded-2xl border-0 minimal-shadow-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="flex items-center justify-center space-x-2 text-xl">
              <div className="w-8 h-8 theme-primary rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span>Assign New Homework</span>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Title *</Label>
                <Input
                  placeholder="Enter homework title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="rounded-xl border-gray-200 h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Class *</Label>
                <Select value={formData.class_assigned} onValueChange={(value) => setFormData(prev => ({ ...prev, class_assigned: value }))}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.homework_count} existing homework)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Subject *</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger className="rounded-xl border-gray-200 h-12">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-xl border-gray-200 h-12"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(formData.due_date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Estimated Duration (minutes)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                  className="rounded-xl border-gray-200 h-12"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Description *</Label>
              <Textarea
                placeholder="Describe the homework assignment..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="rounded-xl border-gray-200 resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Additional Instructions</Label>
              <Textarea
                placeholder="Any additional instructions or notes..."
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={2}
                className="rounded-xl border-gray-200 resize-none"
              />
            </div>

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
                disabled={isLoading}
                className="flex-1 theme-primary rounded-xl h-12 font-medium"
              >
                {isLoading ? 'Assigning...' : 'Assign Homework'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeworkTab;