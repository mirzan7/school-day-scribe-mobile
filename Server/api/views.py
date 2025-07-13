from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from homework.models import Class, Homework, Subject, Teacher, TeacherReport
from .serializers import (
    CustomTokenObtainPairSerializer,
    PendingApprovalSerializer,
    TeacherOverviewSerializer,
    TeacherProfileSerializer,
    TeacherReportSerializer,
    TeacherSerializer,
)

# import transaction
from django.db import transaction
from django.db.models import Q,Count
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone
# from django.utils import timezone


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class AddTeacher(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Extract data from request
            name = request.data.get("name")
            teacher_id = request.data.get("teacherId")
            department = request.data.get("department")
            role = request.data.get("role", "teacher")
            phone = request.data.get("phone", "")

            # Validate required fields
            if not all([name, teacher_id, department]):
                return Response(
                    {"error": "Name, teacher ID, and department are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if teacher_id already exists
            if Teacher.objects.filter(teacher_id=teacher_id).exists():
                return Response(
                    {"error": "Teacher ID already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if username already exists
            if User.objects.filter(username=name).exists():
                return Response(
                    {"error": "Username already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Transform data for nested serializer
            teacher_data = {
                "user": {
                    "username": name,
                    "role": "teacher",  # Set role as teacher for User model
                },
                "teacher_id": teacher_id,
                "department": department,
                "role": role,  # This is the teacher role (teacher, senior_teacher, etc.)
                "phone": phone,
            }

            # Create teacher using serializer
            with transaction.atomic():
                serializer = TeacherSerializer(data=teacher_data)
                if serializer.is_valid():
                    teacher = serializer.save()
                    return Response(
                        TeacherSerializer(teacher).data, status=status.HTTP_201_CREATED
                    )
                else:
                    return Response(
                        serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )

        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangePassword(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get("password")
        if not new_password:
            return Response({"error": "Password is required."}, status=400)
        user.set_password(new_password)
        user.save()


class GetTeacherReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            teacher = request.user.teacher_profile
        except AttributeError:
            return Response(
                {"error": "Teacher profile not found for this user."}, status=404
            )

        today = date.today()
        reports = TeacherReport.objects.filter(created_at__date=today, teacher=teacher)

        # Get all subjects and classes
        subjects = Subject.objects.all()
        classes = Class.objects.all()

        serializer = TeacherReportSerializer(reports, many=True)

        return Response(
            {
                "reports": serializer.data,
                "subjects": list(subjects.values("id", "name", "code")),
                "classes": list(classes.values("id", "name", "section", "grade")),
            },
            status=200,
        )


class TeacherReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            print(request.data)
            teacher = request.user.teacher_profile
        except AttributeError:
            return Response(
                {"error": "Teacher profile not found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = request.data.copy()

        # Validate required fields
        required_fields = ["period", "subject_id", "class_assigned_id"]
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {"error": f"{field} is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Validate activity content
        if not data.get("activity") and not data.get("homework_description"):
            return Response(
                {"error": "Either activity description or homework must be provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                # Get subject and class instances
                try:
                    subject = Subject.objects.get(id=data["subject_id"])
                    class_assigned = Class.objects.get(id=data["class_assigned_id"])
                except (Subject.DoesNotExist, Class.DoesNotExist):
                    return Response(
                        {"error": "Invalid subject or class ID."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check if report already exists for this period today
                today = date.today()
                existing_report = TeacherReport.objects.filter(
                    teacher=teacher, period=data["period"], created_at__date=today
                ).first()

                if existing_report:
                    return Response(
                        {
                            "error": f"Report for period {data['period']} already exists for today."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Create homework if provided
                homework = None
                if data.get("homework_description"):
                    # Check if class can have more homework today
                    if not class_assigned.can_assign_homework_today():
                        return Response(
                            {
                                "error": f"Daily homework limit reached for class {class_assigned.name}."
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    homework = Homework.objects.create(
                        title=f"Homework - {subject.name} - Period {data['period']}",
                        description=data["homework_description"],
                        class_assigned=class_assigned,
                        subject=subject,
                        teacher=teacher,
                        due_date=data.get(
                            "due_date", datetime.now() + timezone.timedelta(days=1)
                        ),
                        estimated_duration=data.get("estimated_duration", 30),
                        priority=data.get("priority", "medium"),
                    )

                # Create teacher report
                report_data = {
                    "teacher": teacher.id,
                    "subject": subject.id,
                    "class_assigned": class_assigned.id,
                    "period": data["period"],
                    "activity": data.get("activity", ""),
                    "homework": homework.id if homework else None,
                }

                serializer = TeacherReportSerializer(data=report_data)
                if serializer.is_valid():
                    report = serializer.save(teacher=teacher)

                    # Return the created report with related data
                    response_serializer = TeacherReportSerializer(report)
                    print(serializer.data)
                    return Response(
                        response_serializer.data, status=status.HTTP_201_CREATED
                    )
                else:
                    return Response(
                        serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )

        except Exception as e:
            print(e)
            return Response(
                {"error": f"Failed to create report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request, report_id):
        """
        Handles PUT requests to update an existing teacher report.
        """
        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            print("not found")
            return Response(
                {"error": "Teacher profile not found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            report = TeacherReport.objects.get(id=report_id, teacher=teacher)
        except TeacherReport.DoesNotExist:
            return Response(
                {"error": "Report not found or you do not have permission to edit it."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = request.data.copy()
        try:
            with transaction.atomic():
                subject = Subject.objects.get(id=data.get("subject_id", report.subject.id))
                class_assigned = Class.objects.get(id=data.get("class_assigned_id", report.class_assigned.id))

                # --- Homework Management ---
                homework_description = data.get("homework_description")
                if homework_description:
                    if report.homework: # Update existing homework
                        report.homework.description = homework_description
                        report.homework.save()
                    else: # Create new homework
                        report.homework = Homework.objects.create(
                            title=f"Homework - {subject.name} - Period {report.period}",
                            description=homework_description,
                            class_assigned=class_assigned,
                            subject=subject,
                            teacher=teacher,
                        )
                elif report.homework: # Delete homework if description is removed
                    report.homework.delete()
                    report.homework = None

                # --- Update Report Fields ---
                report.subject = subject
                report.class_assigned = class_assigned
                report.activity = data.get("activity", report.activity)
                report.status = "pending" # Reset approval status
                report.save()

                response_serializer = TeacherReportSerializer(report)
                return Response(response_serializer.data, status=status.HTTP_200_OK)

        except (Subject.DoesNotExist, Class.DoesNotExist):
             return Response({"error": "Invalid subject or class ID."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            
            return Response({"error": f"Failed to update report: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
        
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            role = user.role.lower()
        except AttributeError:
            return Response(
                {"error": "User role not found."}, status=status.HTTP_400_BAD_REQUEST
            )

        if role == "principal":
            teachers = Teacher.objects.all()
            serializer = TeacherProfileSerializer(teachers, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            try:
                class_taught = TeacherReport.objects.filter(
                    teacher=user.teacher_profile, status = "approved"
                ).count()
                return Response({"count": class_taught}, status=status.HTTP_200_OK)
            except Teacher.DoesNotExist:
                return Response(
                    {"error": "Teacher profile not found for this user."},
                    status=status.HTTP_404_NOT_FOUND,
                )

class CustomTeacherReportView(APIView):
    def get(self, request):
        try:
            
            date = datetime.strptime(request.query_params.get('date'), '%Y-%m-%d').date() 
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=400)

        reports = TeacherReport.objects.filter(created_at__date=date)
        serializer = TeacherReportSerializer(reports, many=True)
        print(serializer.data)
        return Response(serializer.data)
    
    
class UnifiedDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get dashboard data based on query parameters.
        
        Query Parameters:
        - section: 'pending', 'teachers', 'stats', or 'all' (default: 'all')
        - limit: number of records to return (default: 10 for pending approvals)
        """
        try:
            section = request.query_params.get('section', 'all').lower()
            limit = int(request.query_params.get('limit', 10))
            
            response_data = {}
            
            # Get pending approvals
            if section in ['pending', 'all']:
                pending_approvals = TeacherReport.objects.filter(
                    status='pending'
                ).select_related(
                    'teacher__user', 'subject', 'class_assigned'
                ).order_by('-created_at')[:limit]
                
                response_data['pending_approvals'] = PendingApprovalSerializer(
                    pending_approvals, many=True
                ).data
                
                if section == 'pending':
                    response_data['count'] = TeacherReport.objects.filter(
                        status='pending'
                    ).count()
            
            # Get teachers overview
            if section in ['teachers', 'all']:
                teachers_overview = Teacher.objects.select_related('user').annotate(
                    pending_count=Count('teacherreport', filter=Q(teacherreport__status='pending'))
                ).order_by('user__username')
                
                response_data['teachers_overview'] = TeacherOverviewSerializer(
                    teachers_overview, many=True
                ).data
                
                if section == 'teachers':
                    response_data['total_count'] = teachers_overview.count()
            
            # Get statistics
            if section in ['stats', 'all']:
                today = timezone.now().date()
                
                stats = {
                    'total_teachers': Teacher.objects.count(),
                    'pending_approvals': TeacherReport.objects.filter(status='pending').count(),
                    'today_reports': TeacherReport.objects.filter(created_at__date=today).count()
                }
                
                response_data['stats'] = stats
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except ValueError:
            return Response(
                {'error': 'Invalid limit parameter. Must be a number.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(e)
            return Response(
                {'error': 'Failed to fetch dashboard data', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """
        Handle actions like approve/reject reports.
        
        Request body:
        {
            "action": "approve" or "reject",
            "report_id": 1
        }
        """
        try:
            action = request.data.get('action')
            report_id = request.data.get('report_id')
            
            if not action or not report_id:
                return Response(
                    {'error': 'Both action and report_id are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if action not in ['approve', 'reject']:
                return Response(
                    {'error': 'Invalid action. Use "approve" or "reject"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get and update report
            report = TeacherReport.objects.get(id=report_id)
            
            if action == 'approve':
                report.status = 'approved'
            else:
                report.status = 'rejected'
            
            report.save()
            
            # Return updated dashboard data
            return Response({
                'message': f'Report {action}d successfully',
                'report_id': report_id,
                'new_status': report.status,
                'dashboard_data': self.get_dashboard_data()
            }, status=status.HTTP_200_OK)
            
        except TeacherReport.DoesNotExist:
            return Response(
                {'error': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to update report status', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_dashboard_data(self):
        """Helper method to get fresh dashboard data after actions"""
        try:
            # Get fresh data
            pending_approvals = TeacherReport.objects.filter(
                status='pending'
            ).select_related(
                'teacher__user', 'subject', 'class_assigned'
            ).order_by('-created_at')[:10]
            
            teachers_overview = Teacher.objects.select_related('user').annotate(
                pending_count=Count('teacherreport', filter=Q(teacherreport__status='pending'))
            ).order_by('user__username')
            
            today = timezone.now().date()
            stats = {
                'total_teachers': Teacher.objects.count(),
                'pending_approvals': TeacherReport.objects.filter(status='pending').count(),
                'today_reports': TeacherReport.objects.filter(created_at__date=today).count()
            }
            
            return {
                'pending_approvals': PendingApprovalSerializer(pending_approvals, many=True).data,
                'teachers_overview': TeacherOverviewSerializer(teachers_overview, many=True).data,
                'stats': stats
            }
        except Exception:
            return {}