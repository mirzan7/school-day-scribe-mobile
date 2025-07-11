from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Class, Subject, Teacher, Homework, HomeworkNotification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class ClassSerializer(serializers.ModelSerializer):
    homework_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = ['id', 'name', 'section', 'grade', 'homework_count', 'created_at']
    
    def get_homework_count(self, obj):
        return obj.homeworks.filter(status='approved', is_active=True).count()

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'created_at']

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Teacher
        fields = ['id', 'user', 'teacher_id', 'department', 'role', 'phone', 'created_at']

class HomeworkSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    class_assigned = ClassSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    approved_by = TeacherSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    
    class Meta:
        model = Homework
        fields = [
            'id', 'title', 'description', 'class_assigned', 'subject', 'teacher',
            'due_date', 'assigned_date', 'estimated_duration', 'priority',
            'status', 'approved_by', 'approved_at', 'rejection_reason',
            'attachments', 'instructions', 'is_active', 'is_overdue', 'days_until_due',
            'created_at', 'updated_at'
        ]

class HomeworkCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homework
        fields = [
            'title', 'description', 'class_assigned', 'subject',
            'due_date', 'estimated_duration', 'priority', 'instructions', 'attachments'
        ]
    
    def create(self, validated_data):
        validated_data['teacher'] = self.context['request'].user.teacher
        return super().create(validated_data)

class HomeworkNotificationSerializer(serializers.ModelSerializer):
    homework = HomeworkSerializer(read_only=True)
    recipient = TeacherSerializer(read_only=True)
    sender = TeacherSerializer(read_only=True)
    
    class Meta:
        model = HomeworkNotification
        fields = [
            'id', 'notification_type', 'homework', 'recipient', 'sender',
            'title', 'message', 'is_read', 'created_at', 'read_at'
        ]

class ClassHomeworkSummarySerializer(serializers.Serializer):
    class_info = ClassSerializer()
    total_homeworks = serializers.IntegerField()
    pending_homeworks = serializers.IntegerField()
    approved_homeworks = serializers.IntegerField()
    overdue_homeworks = serializers.IntegerField()
    total_estimated_time = serializers.IntegerField()
    subjects_with_homework = serializers.ListField()
    recent_homeworks = HomeworkSerializer(many=True)