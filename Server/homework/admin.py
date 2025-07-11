from django.contrib import admin
from .models import Class, Subject, Teacher, Homework, HomeworkNotification

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'section', 'grade', 'created_at']
    list_filter = ['grade', 'created_at']
    search_fields = ['name', 'section']

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'created_at']
    search_fields = ['name', 'code']

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'teacher_id', 'department', 'role', 'created_at']
    list_filter = ['role', 'department', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'teacher_id', 'department']

@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ['title', 'class_assigned', 'subject', 'teacher', 'due_date', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'subject', 'class_assigned', 'created_at', 'due_date']
    search_fields = ['title', 'description', 'teacher__user__first_name', 'teacher__user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'class_assigned', 'subject', 'teacher')
        }),
        ('Assignment Details', {
            'fields': ('due_date', 'estimated_duration', 'priority', 'instructions')
        }),
        ('Approval', {
            'fields': ('status', 'approved_by', 'approved_at', 'rejection_reason')
        }),
        ('Additional', {
            'fields': ('attachments', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(HomeworkNotification)
class HomeworkNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'notification_type', 'homework', 'recipient', 'sender', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__user__first_name', 'recipient__user__last_name']
    readonly_fields = ['created_at', 'read_at']