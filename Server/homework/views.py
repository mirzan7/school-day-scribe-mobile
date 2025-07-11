from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import Class, Subject, Teacher, Homework, HomeworkNotification
from .serializers import (
    ClassSerializer, SubjectSerializer, TeacherSerializer,
    HomeworkSerializer, HomeworkCreateSerializer, HomeworkNotificationSerializer,
    ClassHomeworkSummarySerializer
)

class ClassViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def homework_summary(self, request, pk=None):
        """Get homework summary for a specific class"""
        class_obj = self.get_object()
        
        # Get homework statistics
        homeworks = class_obj.homeworks.filter(is_active=True)
        total_homeworks = homeworks.count()
        pending_homeworks = homeworks.filter(status='pending').count()
        approved_homeworks = homeworks.filter(status='approved').count()
        overdue_homeworks = homeworks.filter(
            status='approved',
            due_date__lt=timezone.now()
        ).count()
        
        # Calculate total estimated time
        total_time = homeworks.filter(status='approved').aggregate(
            total=Sum('estimated_duration')
        )['total'] or 0
        
        # Get subjects with homework
        subjects_with_homework = list(
            homeworks.filter(status='approved')
            .values_list('subject__name', flat=True)
            .distinct()
        )
        
        # Get recent homeworks (last 7 days)
        recent_homeworks = homeworks.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:5]
        
        summary_data = {
            'class_info': class_obj,
            'total_homeworks': total_homeworks,
            'pending_homeworks': pending_homeworks,
            'approved_homeworks': approved_homeworks,
            'overdue_homeworks': overdue_homeworks,
            'total_estimated_time': total_time,
            'subjects_with_homework': subjects_with_homework,
            'recent_homeworks': recent_homeworks,
        }
        
        serializer = ClassHomeworkSummarySerializer(summary_data)
        return Response(serializer.data)

class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

class HomeworkViewSet(viewsets.ModelViewSet):
    queryset = Homework.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return HomeworkCreateSerializer
        return HomeworkSerializer
    
    def get_queryset(self):
        queryset = Homework.objects.all()
        
        # Filter by class if specified
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_assigned_id=class_id)
        
        # Filter by teacher if not principal
        if hasattr(self.request.user, 'teacher'):
            teacher = self.request.user.teacher
            if teacher.role != 'principal':
                queryset = queryset.filter(teacher=teacher)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        homework = serializer.save()
        
        # Send notification to principal
        self._send_homework_notification(homework, 'new_homework')
        
        # Check for high homework load and warn if necessary
        self._check_homework_load(homework)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve homework (Principal only)"""
        homework = self.get_object()
        
        if not hasattr(request.user, 'teacher') or request.user.teacher.role != 'principal':
            return Response(
                {'error': 'Only principals can approve homework'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        homework.status = 'approved'
        homework.approved_by = request.user.teacher
        homework.approved_at = timezone.now()
        homework.save()
        
        # Send notification to teacher
        self._send_homework_notification(homework, 'homework_approved')
        
        serializer = self.get_serializer(homework)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject homework (Principal only)"""
        homework = self.get_object()
        
        if not hasattr(request.user, 'teacher') or request.user.teacher.role != 'principal':
            return Response(
                {'error': 'Only principals can reject homework'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        rejection_reason = request.data.get('reason', '')
        
        homework.status = 'rejected'
        homework.rejection_reason = rejection_reason
        homework.save()
        
        # Send notification to teacher
        self._send_homework_notification(homework, 'homework_rejected')
        
        serializer = self.get_serializer(homework)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_homeworks(self, request):
        """Get homeworks assigned by the current teacher"""
        if not hasattr(request.user, 'teacher'):
            return Response(
                {'error': 'User is not a teacher'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        homeworks = Homework.objects.filter(teacher=request.user.teacher)
        serializer = self.get_serializer(homeworks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get pending homework approvals (Principal only)"""
        if not hasattr(request.user, 'teacher') or request.user.teacher.role != 'principal':
            return Response(
                {'error': 'Only principals can view pending approvals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_homeworks = Homework.objects.filter(status='pending')
        serializer = self.get_serializer(pending_homeworks, many=True)
        return Response(serializer.data)
    
    def _send_homework_notification(self, homework, notification_type):
        """Send WebSocket notification"""
        channel_layer = get_channel_layer()
        
        # Determine recipient based on notification type
        if notification_type == 'new_homework':
            # Send to principal
            try:
                principal = Teacher.objects.get(role='principal')
                recipient = principal
                sender = homework.teacher
                title = f"New Homework: {homework.title}"
                message = f"{homework.teacher.user.get_full_name()} assigned homework '{homework.title}' to {homework.class_assigned}"
            except Teacher.DoesNotExist:
                return
        else:
            # Send to teacher who created the homework
            recipient = homework.teacher
            sender = homework.approved_by
            if notification_type == 'homework_approved':
                title = f"Homework Approved: {homework.title}"
                message = f"Your homework '{homework.title}' has been approved by {homework.approved_by.user.get_full_name()}"
            else:  # homework_rejected
                title = f"Homework Rejected: {homework.title}"
                message = f"Your homework '{homework.title}' has been rejected. Reason: {homework.rejection_reason}"
        
        # Create notification record
        notification = HomeworkNotification.objects.create(
            notification_type=notification_type,
            homework=homework,
            recipient=recipient,
            sender=sender,
            title=title,
            message=message
        )
        
        # Send WebSocket message
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.user.id}",
            {
                'type': 'homework_notification',
                'notification': {
                    'id': notification.id,
                    'type': notification_type,
                    'title': title,
                    'message': message,
                    'homework_id': homework.id,
                    'created_at': notification.created_at.isoformat(),
                }
            }
        )
    
    def _check_homework_load(self, homework):
        """Check if class has too much homework and warn principal"""
        # Get homework for the same class in the next 7 days
        upcoming_homeworks = Homework.objects.filter(
            class_assigned=homework.class_assigned,
            status='approved',
            due_date__gte=timezone.now(),
            due_date__lte=timezone.now() + timedelta(days=7)
        )
        
        total_time = upcoming_homeworks.aggregate(
            total=Sum('estimated_duration')
        )['total'] or 0
        
        # If total time exceeds 5 hours (300 minutes), send warning
        if total_time > 300:
            try:
                principal = Teacher.objects.get(role='principal')
                
                notification = HomeworkNotification.objects.create(
                    notification_type='high_homework_load',
                    homework=homework,
                    recipient=principal,
                    sender=homework.teacher,
                    title=f"High Homework Load Warning: {homework.class_assigned}",
                    message=f"Class {homework.class_assigned} has {total_time} minutes of homework due in the next 7 days."
                )
                
                # Send WebSocket notification
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"user_{principal.user.id}",
                    {
                        'type': 'homework_notification',
                        'notification': {
                            'id': notification.id,
                            'type': 'high_homework_load',
                            'title': notification.title,
                            'message': notification.message,
                            'homework_id': homework.id,
                            'created_at': notification.created_at.isoformat(),
                        }
                    }
                )
            except Teacher.DoesNotExist:
                pass

class HomeworkNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HomeworkNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if hasattr(self.request.user, 'teacher'):
            return HomeworkNotification.objects.filter(
                recipient=self.request.user.teacher
            ).order_by('-created_at')
        return HomeworkNotification.objects.none()
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(is_read=False)
        notifications.update(is_read=True, read_at=timezone.now())
        
        return Response({'message': 'All notifications marked as read'})