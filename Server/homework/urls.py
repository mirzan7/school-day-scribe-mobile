# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import (
#     ClassViewSet, SubjectViewSet, TeacherViewSet,
#     HomeworkViewSet, HomeworkNotificationViewSet
# )

# router = DefaultRouter()
# router.register(r'classes', ClassViewSet)
# router.register(r'subjects', SubjectViewSet)
# router.register(r'teachers', TeacherViewSet)
# router.register(r'homeworks', HomeworkViewSet)
# router.register(r'notifications', HomeworkNotificationViewSet, basename='notification')

# urlpatterns = [
#     path('api/', include(router.urls)),
# ]