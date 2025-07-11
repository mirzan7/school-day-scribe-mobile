from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Class, Subject, Teacher, Homework, HomeworkNotification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class ClassSerializer(serializers.ModelSerializer):
    homework_count_today = serializers.SerializerMethodField()
    homework_limit = serializers.ReadOnlyField(source='daily_homework_limit')
    can_assign_more = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = ['id', 'name', 'section', 'grade', 'homework_count_today', 'homework_limit', 'can_assign_more', 'created_at']
    
    def get_homework_count_today(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.get_homework_count_for_date(today)
    
    def get_can_assign_more(self, obj):
        return obj.can_assign_homework_today()

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
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Homework
        fields = [
            'id', 'title', 'description', 'image', 'image_url', 'class_assigned', 'subject', 'teacher',
            'due_date', 'assigned_date', 'estimated_duration', 'priority',
            'instructions', 'is_active', 'is_overdue', 'days_until_due',
            'created_at', 'updated_at'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

class HomeworkCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homework
        fields = [
            'title', 'description', 'image', 'class_assigned', 'subject',
            'due_date', 'estimated_duration', 'priority', 'instructions'
        ]
    
    def validate(self, data):
        if not data.get('description') and not data.get('image'):
            raise serializers.ValidationError("Either description or image must be provided.")
        return data
    
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
            'id', 'notification_type', 'homework', 'class_assigned', 'recipient', 'sender',
            'title', 'message', 'is_read', 'created_at', 'read_at'
        ]

class ClassHomeworkSummarySerializer(serializers.Serializer):
    class_info = ClassSerializer()
    total_homeworks = serializers.IntegerField()
    today_homeworks = serializers.IntegerField()
    overdue_homeworks = serializers.IntegerField()
    total_estimated_time = serializers.IntegerField()
    subjects_with_homework = serializers.ListField()
    recent_homeworks = HomeworkSerializer(many=True)
    homework_limit = serializers.IntegerField()
    can_assign_more = serializers.BooleanField()