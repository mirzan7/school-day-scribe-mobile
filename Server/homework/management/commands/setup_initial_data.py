from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from homework.models import Class, Subject, Teacher

class Command(BaseCommand):
    help = 'Setup initial data for homework app'

    def handle(self, *args, **options):
        # Create classes
        classes_data = [
            {'name': '6A', 'section': 'A', 'grade': 6},
            {'name': '6B', 'section': 'B', 'grade': 6},
            {'name': '7A', 'section': 'A', 'grade': 7},
            {'name': '7B', 'section': 'B', 'grade': 7},
            {'name': '8A', 'section': 'A', 'grade': 8},
            {'name': '8B', 'section': 'B', 'grade': 8},
            {'name': '9A', 'section': 'A', 'grade': 9},
            {'name': '9B', 'section': 'B', 'grade': 9},
            {'name': '10A', 'section': 'A', 'grade': 10},
            {'name': '10B', 'section': 'B', 'grade': 10},
        ]
        
        for class_data in classes_data:
            Class.objects.get_or_create(**class_data)
        
        # Create subjects
        subjects_data = [
            {'name': 'Mathematics', 'code': 'MATH'},
            {'name': 'Science', 'code': 'SCI'},
            {'name': 'English', 'code': 'ENG'},
            {'name': 'History', 'code': 'HIST'},
            {'name': 'Geography', 'code': 'GEO'},
            {'name': 'Physics', 'code': 'PHY'},
            {'name': 'Chemistry', 'code': 'CHEM'},
            {'name': 'Biology', 'code': 'BIO'},
            {'name': 'Computer Science', 'code': 'CS'},
            {'name': 'Physical Education', 'code': 'PE'},
        ]
        
        for subject_data in subjects_data:
            Subject.objects.get_or_create(**subject_data)
        
        # Create users and teachers
        teachers_data = [
            {
                'username': 'teacher1',
                'email': 'teacher@school.edu',
                'first_name': 'John',
                'last_name': 'Teacher',
                'teacher_id': 'T001',
                'department': 'General Education',
                'role': 'teacher'
            },
            {
                'username': 'principal1',
                'email': 'principal@school.edu',
                'first_name': 'Principal',
                'last_name': 'Smith',
                'teacher_id': 'P001',
                'department': 'Administration',
                'role': 'principal'
            },
            {
                'username': 'teacher2',
                'email': 'sarah.math@school.edu',
                'first_name': 'Sarah',
                'last_name': 'Mathematics',
                'teacher_id': 'T002',
                'department': 'Mathematics',
                'role': 'teacher'
            },
        ]
        
        for teacher_data in teachers_data:
            user_data = {
                'username': teacher_data['username'],
                'email': teacher_data['email'],
                'first_name': teacher_data['first_name'],
                'last_name': teacher_data['last_name'],
            }
            
            user, created = User.objects.get_or_create(
                username=teacher_data['username'],
                defaults=user_data
            )
            
            if created:
                user.set_password('password123')
                user.save()
            
            teacher_info = {
                'teacher_id': teacher_data['teacher_id'],
                'department': teacher_data['department'],
                'role': teacher_data['role'],
            }
            
            Teacher.objects.get_or_create(
                user=user,
                defaults=teacher_info
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created initial data')
        )