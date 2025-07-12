from django.db import models
from api.models import User,BaseModel
from django.utils import timezone
from django.core.exceptions import ValidationError

class Class(models.Model):
    name = models.CharField(max_length=50, unique=True)
    section = models.CharField(max_length=10, blank=True)
    grade = models.IntegerField()
    daily_homework_limit = models.IntegerField(default=3, help_text="Maximum homework assignments per day")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name}"
    
    def get_homework_count_for_date(self, date):
        """Get homework count for a specific date"""
        return self.homeworks.filter(
            assigned_date__date=date,
            is_active=True
        ).count()
    
    def can_assign_homework_today(self):
        """Check if more homework can be assigned today"""
        today = timezone.now().date()
        current_count = self.get_homework_count_for_date(today)
        return current_count < self.daily_homework_limit
    
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
    

def homework_image_upload_path(instance, filename):
    """Generate upload path for homework images"""
    return f'homework_images/{instance.teacher.teacher_id}/{timezone.now().strftime("%Y/%m/%d")}/{filename}'

class Homework(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to=homework_image_upload_path, blank=True, null=True, help_text="Upload homework image instead of description")
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='homeworks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assigned_homeworks')
    
    due_date = models.DateTimeField()
    assigned_date = models.DateTimeField(auto_now_add=True)
    estimated_duration = models.IntegerField(help_text="Estimated time in minutes", default=30)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Additional fields
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        """Validate homework assignment"""
        if not self.description and not self.image:
            raise ValidationError("Either description or image must be provided.")
        
        # Check daily homework limit
        if self.class_assigned:
            today = timezone.now().date()
            current_count = self.class_assigned.get_homework_count_for_date(today)
            if current_count >= self.class_assigned.daily_homework_limit:
                raise ValidationError(
                    f"Daily homework limit ({self.class_assigned.daily_homework_limit}) "
                    f"reached for class {self.class_assigned.name}"
                )
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.class_assigned} ({self.subject})"
    
    @property
    def is_overdue(self):
        return timezone.now() > self.due_date
    
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
        ('homework_limit_reached', 'Homework Limit Reached'),
        ('homework_assigned', 'Homework Assigned'),
        ('homework_overdue', 'Homework Overdue'),
    ]
    
    notification_type = models.CharField(max_length=25, choices=NOTIFICATION_TYPES)
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, null=True, blank=True)
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

class BulkTeacherUpload(models.Model):
    """Model to track bulk teacher uploads"""
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    excel_file = models.FileField(upload_to='bulk_uploads/')
    total_records = models.IntegerField(default=0)
    successful_records = models.IntegerField(default=0)
    failed_records = models.IntegerField(default=0)
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Bulk upload by {self.uploaded_by.username} - {self.created_at}"
    
class TeacherReport(BaseModel):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    period = models.IntegerField(max_length=20)
    activity = models.TextField(blank=True)
    homework = models.ForeignKey(Homework, on_delete=models.SET_NULL, null=True, blank=True)
    approved = models.BooleanField(default=False)