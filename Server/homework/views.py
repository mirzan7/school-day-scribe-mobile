# from rest_framework import viewsets, status, permissions
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.db.models import Count, Sum, Q
# from django.utils import timezone
# from datetime import timedelta
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync
# import json

# from .models import Class, Subject, Teacher, Homework, HomeworkNotification
# from .serializers import (
#     ClassSerializer, SubjectSerializer, TeacherSerializer,
#     HomeworkSerializer, HomeworkCreateSerializer, HomeworkNotificationSerializer,
#     ClassHomeworkSummarySerializer
# )

# class ClassViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = Class.objects.all()
#     serializer_class = ClassSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
#     @action(detail=True, methods=['get'])
#     def homework_summary(self, request, pk=None):
#         """Get homework summary for a specific class"""
#         class_obj = self.get_object()
#         today = timezone.now().date()
        
#         # Get homework statistics
#         homeworks = class_obj.homeworks.filter(is_active=True)
#         total_homeworks = homeworks.count()
#         today_homeworks = class_obj.get_homework_count_for_date(today)
#         overdue_homeworks = homeworks.filter(due_date__lt=timezone.now()).count()
        
#         # Calculate total estimated time for today
#         total_time = homeworks.filter(
#             assigned_date__date=today
#         ).aggregate(total=Sum('estimated_duration'))['total'] or 0
        
#         # Get subjects with homework today
#         subjects_with_homework = list(
#             homeworks.filter(assigned_date__date=today)
#             .values_list('subject__name', flat=True)
#             .distinct()
#         )
        
#         # Get recent homeworks (last 7 days)
#         recent_homeworks = homeworks.filter(
#             created_at__gte=timezone.now() - timedelta(days=7)
#         ).order_by('-created_at')[:5]
        
#         summary_data = {
#             'class_info': class_obj,
#             'total_homeworks': total_homeworks,
#             'today_homeworks': today_homeworks,
#             'overdue_homeworks': overdue_homeworks,
#             'total_estimated_time': total_time,
#             'subjects_with_homework': subjects_with_homework,
#             'recent_homeworks': recent_homeworks,
#             'homework_limit': class_obj.daily_homework_limit,
#             'can_assign_more': class_obj.can_assign_homework_today(),
#         }
        
#         serializer = ClassHomeworkSummarySerializer(summary_data)
#         return Response(serializer.data)

# class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = Subject.objects.all()
#     serializer_class = SubjectSerializer
#     permission_classes = [permissions.IsAuthenticated]

# class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = Teacher.objects.all()
#     serializer_class = TeacherSerializer
#     permission_classes = [permissions.IsAuthenticated]

# class HomeworkViewSet(viewsets.ModelViewSet):
#     queryset = Homework.objects.all()
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_serializer_class(self):
#         if self.action == 'create':
#             return HomeworkCreateSerializer
#         return HomeworkSerializer
    
#     def get_queryset(self):
#         queryset = Homework.objects.all()
        
#         # Filter by class if specified
#         class_id = self.request.query_params.get('class_id')
#         if class_id:
#             queryset = queryset.filter(class_assigned_id=class_id)
        
#         # Filter by teacher if not principal
#         if hasattr(self.request.user, 'teacher'):
#             teacher = self.request.user.teacher
#             if teacher.role not in ['principal', 'vice_principal']:
#                 queryset = queryset.filter(teacher=teacher)
        
#         # Filter by date
#         date_filter = self.request.query_params.get('date')
#         if date_filter:
#             queryset = queryset.filter(assigned_date__date=date_filter)
        
#         return queryset.order_by('-created_at')
    
#     def perform_create(self, serializer):
#         homework = serializer.save()
        
#         # Send notification to principal about homework assignment
#         self._send_homework_notification(homework, 'homework_assigned')
        
#         # Check if homework limit is reached and notify principal
#         if not homework.class_assigned.can_assign_homework_today():
#             self._send_limit_notification(homework.class_assigned, homework.teacher)
    
#     @action(detail=False, methods=['get'])
#     def my_homeworks(self, request):
#         """Get homeworks assigned by the current teacher"""
#         if not hasattr(request.user, 'teacher'):
#             return Response(
#                 {'error': 'User is not a teacher'},
#                 status=status.HTTP_403_FORBIDDEN
#             )
        
#         homeworks = Homework.objects.filter(teacher=request.user.teacher)
#         serializer = self.get_serializer(homeworks, many=True)
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['get'])
#     def today_summary(self, request):
#         """Get today's homework summary"""
#         today = timezone.now().date()
        
#         if hasattr(request.user, 'teacher'):
#             teacher = request.user.teacher
#             if teacher.role in ['principal', 'vice_principal']:
#                 # Principal can see all homework
#                 homeworks = Homework.objects.filter(assigned_date__date=today)
#             else:
#                 # Teachers can only see their own
#                 homeworks = Homework.objects.filter(
#                     teacher=teacher,
#                     assigned_date__date=today
#                 )
#         else:
#             homeworks = Homework.objects.none()
        
#         # Group by class
#         class_summary = {}
#         for homework in homeworks:
#             class_name = homework.class_assigned.name
#             if class_name not in class_summary:
#                 class_summary[class_name] = {
#                     'class_id': homework.class_assigned.id,
#                     'homework_count': 0,
#                     'homework_limit': homework.class_assigned.daily_homework_limit,
#                     'homeworks': []
#                 }
#             class_summary[class_name]['homework_count'] += 1
#             class_summary[class_name]['homeworks'].append({
#                 'id': homework.id,
#                 'title': homework.title,
#                 'subject': homework.subject.name,
#                 'teacher': homework.teacher.user.get_full_name(),
#                 'priority': homework.priority,
#                 'due_date': homework.due_date,
#             })
        
#         return Response(class_summary)
    
#     def _send_homework_notification(self, homework, notification_type):
#         """Send WebSocket notification"""
#         channel_layer = get_channel_layer()
        
#         # Send to principal
#         try:
#             principals = Teacher.objects.filter(role='principal')
#             for principal in principals:
#                 title = f"New Homework: {homework.title}"
#                 message = f"{homework.teacher.user.get_full_name()} assigned homework '{homework.title}' to {homework.class_assigned}"
                
#                 # Create notification record
#                 notification = HomeworkNotification.objects.create(
#                     notification_type=notification_type,
#                     homework=homework,
#                     recipient=principal,
#                     sender=homework.teacher,
#                     title=title,
#                     message=message
#                 )
                
#                 # Send WebSocket message
#                 async_to_sync(channel_layer.group_send)(
#                     f"user_{principal.user.id}",
#                     {
#                         'type': 'homework_notification',
#                         'notification': {
#                             'id': notification.id,
#                             'type': notification_type,
#                             'title': title,
#                             'message': message,
#                             'homework_id': homework.id,
#                             'created_at': notification.created_at.isoformat(),
#                         }
#                     }
#                 )
#         except Teacher.DoesNotExist:
#             pass
    
#     def _send_limit_notification(self, class_obj, teacher):
#         """Send notification when homework limit is reached"""
#         channel_layer = get_channel_layer()
        
#         try:
#             principals = Teacher.objects.filter(role='principal')
#             for principal in principals:
#                 title = f"Homework Limit Reached: {class_obj.name}"
#                 message = f"Class {class_obj.name} has reached its daily homework limit of {class_obj.daily_homework_limit} assignments."
                
#                 notification = HomeworkNotification.objects.create(
#                     notification_type='homework_limit_reached',
#                     class_assigned=class_obj,
#                     recipient=principal,
#                     sender=teacher,
#                     title=title,
#                     message=message
#                 )
                
#                 async_to_sync(channel_layer.group_send)(
#                     f"user_{principal.user.id}",
#                     {
#                         'type': 'homework_notification',
#                         'notification': {
#                             'id': notification.id,
#                             'type': 'homework_limit_reached',
#                             'title': title,
#                             'message': message,
#                             'class_id': class_obj.id,
#                             'created_at': notification.created_at.isoformat(),
#                         }
#                     }
#                 )
#         except Teacher.DoesNotExist:
#             pass

# class HomeworkNotificationViewSet(viewsets.ReadOnlyModelViewSet):
#     serializer_class = HomeworkNotificationSerializer
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_queryset(self):
#         if hasattr(self.request.user, 'teacher'):
#             return HomeworkNotification.objects.filter(
#                 recipient=self.request.user.teacher
#             ).order_by('-created_at')
#         return HomeworkNotification.objects.none()
    
#     @action(detail=True, methods=['post'])
#     def mark_read(self, request, pk=None):
#         """Mark notification as read"""
#         notification = self.get_object()
#         notification.is_read = True
#         notification.read_at = timezone.now()
#         notification.save()
        
#         serializer = self.get_serializer(notification)
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['post'])
#     def mark_all_read(self, request):
#         """Mark all notifications as read"""
#         notifications = self.get_queryset().filter(is_read=False)
#         notifications.update(is_read=True, read_at=timezone.now())
        
#         return Response({'message': 'All notifications marked as read'})