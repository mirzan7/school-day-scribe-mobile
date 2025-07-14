from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import (
    AddTeacher,
    ChangePassword,
    CustomTeacherReportView,
    PrincipalView,
    TeacherReportView,
    LoginView,
    GetTeacherReport,
    ProfileView,
    UnifiedDashboardView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="custom_token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("teacher-report/", GetTeacherReport.as_view()),
    path(
        "teacher-report/create/",
        TeacherReportView.as_view(),
    ),
    path(
        "teacher-report/<uuid:report_id>/",
        TeacherReportView.as_view(),
    ),
    path("profile/", ProfileView.as_view()),
    path("create/teacher/", AddTeacher.as_view()),
    path("teacher-reports/", CustomTeacherReportView.as_view()),
    path('dashboard/', UnifiedDashboardView.as_view(), name='dashboard'),
    path("principal-reports/",PrincipalView.as_view()), 
    path("change-password/",ChangePassword.as_view()),
]
