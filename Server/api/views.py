from rest_framework_simplejwt.views import TokenObtainPairView

from homework.models import Class, Homework, Subject,TeacherReport
from .serializers import (
    CustomTokenObtainPairSerializer,
    TeacherReportSerializer,
    TeacherSerializer,
)
#import transaction
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date, timezone
from rest_framework import status
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class AddTeacher(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TeacherSerializer(data=request.data)
        if serializer.is_valid():
            teacher = serializer.save()
            return Response(TeacherSerializer(teacher).data, status=201)
        return Response(serializer.errors, status=400)


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
                {"error": "Teacher profile not found for this user."}, 
                status=404
            )

        today = date.today()
        reports = TeacherReport.objects.filter(created_at__date=today, teacher=teacher)
        
        # Get all subjects and classes
        subjects = Subject.objects.all()
        classes = Class.objects.all()
        
        serializer = TeacherReportSerializer(reports, many=True)
        
        return Response({
            'reports': serializer.data,
            'subjects': list(subjects.values('id', 'name', 'code')),
            'classes': list(classes.values('id', 'name', 'section', 'grade'))
        }, status=200)


class CreateTeacherReport(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            print(request.data)
            teacher = request.user.teacher_profile
        except AttributeError:
            return Response(
                {"error": "Teacher profile not found for this user."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        data = request.data.copy()
        
        # Validate required fields
        required_fields = ['period', 'subject_id', 'class_assigned_id']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {"error": f"{field} is required."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Validate activity content
        if not data.get('activity') and not data.get('homework_description'):
            return Response(
                {"error": "Either activity description or homework must be provided."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Get subject and class instances
                try:
                    subject = Subject.objects.get(id=data['subject_id'])
                    class_assigned = Class.objects.get(id=data['class_assigned_id'])
                except (Subject.DoesNotExist, Class.DoesNotExist):
                    return Response(
                        {"error": "Invalid subject or class ID."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check if report already exists for this period today
                today = date.today()
                existing_report = TeacherReport.objects.filter(
                    teacher=teacher,
                    period=data['period'],
                    created_at__date=today
                ).first()

                if existing_report:
                    return Response(
                        {"error": f"Report for period {data['period']} already exists for today."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create homework if provided
                homework = None
                if data.get('homework_description'):
                    # Check if class can have more homework today
                    if not class_assigned.can_assign_homework_today():
                        return Response(
                            {"error": f"Daily homework limit reached for class {class_assigned.name}."}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    homework = Homework.objects.create(
                        title=f"Homework - {subject.name} - Period {data['period']}",
                        description=data['homework_description'],
                        class_assigned=class_assigned,
                        subject=subject,
                        teacher=teacher,
                        due_date=data.get('due_date', timezone.now() + timezone.timedelta(days=1)),
                        estimated_duration=data.get('estimated_duration', 30),
                        priority=data.get('priority', 'medium')
                    )

                # Create teacher report
                report_data = {
                    'teacher': teacher.id,
                    'subject': subject.id,
                    'class_assigned': class_assigned.id,
                    'period': data['period'],
                    'activity': data.get('activity', ''),
                    'homework': homework.id if homework else None,
                }

                serializer = TeacherReportSerializer(data=report_data)
                if serializer.is_valid():
                    report = serializer.save(teacher=teacher)
                    
                    # Return the created report with related data
                    response_serializer = TeacherReportSerializer(report)
                    print(serializer.data)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(e)
            return Response(
                {"error": f"Failed to create report: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        