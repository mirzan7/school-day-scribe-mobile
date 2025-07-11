from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Class(models.Model):
    name = models.CharField(max_length=50, unique=True)
    section = models.CharField(max_length=10, blank=True)
    grade = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        verbose_name_plural = "Classes"

class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Teacher(models.Model):
    ROLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('senior_teacher', 'Senior Teacher'),
        ('head_of_department', 'Head of Department'),
        ('vice_principal', 'Vice Principal'),
        ('principal', 'Principal'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    teacher_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='teacher')
    phone = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.teacher_id})"

class Homework(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='homeworks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assigned_homeworks')
    
    due_date = models.DateTimeField()
    assigned_date = models.DateTimeField(auto_now_add=True)
    estimated_duration = models.IntegerField(help_text="Estimated time in minutes", default=30)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Approval workflow
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_homeworks')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Additional fields
    attachments = models.JSONField(default=list, blank=True)  # Store file URLs/paths
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.class_assigned} ({self.subject})"
    
    @property
    def is_overdue(self):
        return timezone.now() > self.due_date and self.status == 'approved'
    
    @property
    def days_until_due(self):
        if self.due_date:
            delta = self.due_date - timezone.now()
            return delta.days
        return None
    
    class Meta:
        ordering = ['-created_at']

class HomeworkNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('new_homework', 'New Homework Assigned'),
        ('homework_approved', 'Homework Approved'),
        ('homework_rejected', 'Homework Rejected'),
        ('homework_overdue', 'Homework Overdue'),
        ('high_homework_load', 'High Homework Load Warning'),
    ]
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='received_notifications')
    sender = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.recipient.user.get_full_name()}"
    
    class Meta:
        ordering = ['-created_at']