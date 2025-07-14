# serializers.py
from rest_framework import serializers
from .models import Teacher, Homework, Subject, Class, TeacherReport
from api.models import User

class HomeworkUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class HomeworkSubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code']

class HomeworkClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name', 'section', 'grade']

class HomeworkHomeworkSerializer(serializers.ModelSerializer):
    subject = HomeworkSubjectSerializer(read_only=True)
    class_assigned = HomeworkClassSerializer(read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    
    class Meta:
        model = Homework
        fields = [
            'id', 'title', 'description', 'image', 'subject', 'class_assigned',
            'teacher_name', 'due_date', 'assigned_date', 'estimated_duration',
            'priority', 'is_overdue', 'days_until_due', 'is_active'
        ]

class HomeworkTeacherReportSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    teacher_id = serializers.CharField(source='teacher.teacher_id', read_only=True)
    subject = HomeworkSubjectSerializer(read_only=True)
    class_assigned = HomeworkClassSerializer(read_only=True)
    homework = HomeworkHomeworkSerializer(read_only=True)
    
    class Meta:
        model = TeacherReport
        fields = [
            'id', 'teacher_name', 'teacher_id', 'subject', 'class_assigned',
            'period', 'activity', 'homework', 'status', 'created_at'
        ]

class HomeworkTeacherOverviewSerializer(serializers.ModelSerializer):
    user = HomeworkUserSerializer(read_only=True)
    total_homework_today = serializers.SerializerMethodField()
    total_reports_today = serializers.SerializerMethodField()
    subjects_taught = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'teacher_id', 'user', 'department', 'role', 'phone',
            'total_homework_today', 'total_reports_today', 'subjects_taught'
        ]
    
    def get_total_homework_today(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.assigned_homeworks.filter(
            assigned_date__date=today,
            is_active=True
        ).count()
    
    def get_total_reports_today(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.teacherreport_set.filter(
            created_at__date=today
        ).count()
    
    def get_subjects_taught(self, obj):
        # Get unique subjects from teacher reports
        subjects = obj.teacherreport_set.values_list('subject__name', flat=True).distinct()
        return list(subjects)

