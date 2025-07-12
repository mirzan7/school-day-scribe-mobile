from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import  CreateTeacherReport, LoginView,GetTeacherReport

urlpatterns = [
    path('login/', LoginView.as_view(), name='custom_token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('teacher-report/',GetTeacherReport.as_view()),
    path("teacher-report/create/", CreateTeacherReport.as_view(),)
    
]
