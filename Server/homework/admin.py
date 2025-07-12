from django.contrib import admin
from django.shortcuts import render, redirect
from django.urls import path
from django.contrib import messages
from django.http import HttpResponse
import pandas as pd
import io
from django.contrib.auth.models import User
from .models import Class, Subject, Teacher, Homework, HomeworkNotification, BulkTeacherUpload, TeacherReport

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'section', 'grade', 'daily_homework_limit', 'current_homework_count', 'created_at']
    list_filter = ['grade', 'created_at']
    search_fields = ['name', 'section']
    list_editable = ['daily_homework_limit']
    
    def current_homework_count(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.get_homework_count_for_date(today)
    current_homework_count.short_description = "Today's Homework Count"

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'created_at']
    search_fields = ['name', 'code']

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'teacher_id', 'department', 'role', 'phone', 'created_at']
    list_filter = ['role', 'department', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'teacher_id', 'department']
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='homework_teacher_bulk_upload'),
            path('download-template/', self.admin_site.admin_view(self.download_template), name='homework_teacher_download_template'),
        ]
        return custom_urls + urls
    
    def bulk_upload_view(self, request):
        if request.method == 'POST':
            excel_file = request.FILES.get('excel_file')
            if not excel_file:
                messages.error(request, 'Please select an Excel file.')
                return render(request, 'admin/homework/teacher/bulk_upload.html')
            
            try:
                # Read Excel file
                df = pd.read_excel(excel_file)
                
                # Validate columns
                required_columns = ['name', 'phone_number']
                if not all(col in df.columns for col in required_columns):
                    messages.error(request, f'Excel file must contain columns: {", ".join(required_columns)}')
                    return render(request, 'admin/homework/teacher/bulk_upload.html')
                
                successful_count = 0
                failed_count = 0
                error_log = []
                
                for index, row in df.iterrows():
                    try:
                        name = str(row['name']).strip()
                        phone_number = str(row['phone_number']).strip()
                        
                        if not name or not phone_number:
                            error_log.append(f"Row {index + 2}: Name and phone number are required")
                            failed_count += 1
                            continue
                        
                        # Generate username and teacher_id
                        username = f"{name.lower().replace(' ', '.')}@evps"
                        teacher_id = f"T{str(successful_count + failed_count + 1).zfill(3)}"
                        
                        # Check if user already exists
                        if User.objects.filter(username=username).exists():
                            error_log.append(f"Row {index + 2}: Username {username} already exists")
                            failed_count += 1
                            continue
                        
                        # Create user
                        user = User.objects.create_user(
                            username=username,
                            email=username,
                            password=phone_number,
                            first_name=name.split()[0] if name.split() else name,
                            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
                        )
                        
                        # Create teacher
                        Teacher.objects.create(
                            user=user,
                            teacher_id=teacher_id,
                            department=row.get('department', 'General Education'),
                            role='teacher',
                            phone=phone_number
                        )
                        
                        successful_count += 1
                        
                    except Exception as e:
                        error_log.append(f"Row {index + 2}: {str(e)}")
                        failed_count += 1
                
                # Save upload record
                BulkTeacherUpload.objects.create(
                    uploaded_by=request.user,
                    excel_file=excel_file,
                    total_records=len(df),
                    successful_records=successful_count,
                    failed_records=failed_count,
                    error_log='\n'.join(error_log)
                )
                
                if successful_count > 0:
                    messages.success(request, f'Successfully created {successful_count} teacher accounts.')
                
                if failed_count > 0:
                    messages.warning(request, f'{failed_count} records failed. Check the upload history for details.')
                
                return redirect('admin:homework_teacher_changelist')
                
            except Exception as e:
                messages.error(request, f'Error processing file: {str(e)}')
        
        return render(request, 'admin/homework/teacher/bulk_upload.html')
    
    def download_template(self, request):
        # Create a sample Excel template
        data = {
            'name': ['John Doe', 'Jane Smith', 'Mike Johnson'],
            'phone_number': ['1234567890', '0987654321', '1122334455'],
            'department': ['Mathematics', 'Science', 'English']
        }
        df = pd.DataFrame(data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Teachers')
        
        output.seek(0)
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="teacher_upload_template.xlsx"'
        return response

@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ['title', 'class_assigned', 'subject', 'teacher', 'due_date', 'priority', 'is_active', 'created_at']
    list_filter = ['priority', 'subject', 'class_assigned', 'created_at', 'due_date', 'is_active']
    search_fields = ['title', 'description', 'teacher__user__first_name', 'teacher__user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'image', 'class_assigned', 'subject', 'teacher')
        }),
        ('Assignment Details', {
            'fields': ('due_date', 'estimated_duration', 'priority', 'instructions')
        }),
        ('Status', {
            'fields': ('is_active',)
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

@admin.register(BulkTeacherUpload)
class BulkTeacherUploadAdmin(admin.ModelAdmin):
    list_display = ['uploaded_by', 'total_records', 'successful_records', 'failed_records', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['uploaded_by', 'total_records', 'successful_records', 'failed_records', 'error_log', 'created_at']
    
    def has_add_permission(self, request):
        return False
    
admin.site.register(TeacherReport)