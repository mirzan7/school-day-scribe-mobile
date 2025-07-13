from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User
from homework.models import Teacher, TeacherReport


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user_data = {
            "id": str(self.user.id),
            "username": self.user.username,
            "role": self.user.role,
            "must_change_password": self.user.must_change_password,
        }

        if self.user.role == "teacher":
            teacher_id = self.user.teacher_profile.teacher_id
            department = self.user.teacher_profile.department
            user_data.update({"teacher_id": teacher_id, "department": department})

        data.update({"user": user_data})
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "role"]  # Removed password

    def create(self, validated_data):
        # Set default password to '1234'
        return User.objects.create_user(password="1234", **validated_data)


class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Teacher
        fields = ["user", "teacher_id", "department", "role", "phone"]

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        user = UserSerializer().create(user_data)
        teacher = Teacher.objects.create(user=user, **validated_data)
        return teacher


class TeacherReportSerializer(serializers.ModelSerializer):
    # --- Read-only fields for displaying names ---
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_assigned_name = serializers.CharField(
        source="class_assigned.name", read_only=True
    )
    teacher_name = serializers.CharField(source="teacher.user.username", read_only=True)
    homework_title = serializers.CharField(
        source="homework.description", read_only=True, allow_null=True
    )

    class Meta:
        model = TeacherReport
        fields = [
            "id",
            "period",
            "activity",
            "status",
            "created_at",
            # --- Fields for Reading (Display) ---
            "teacher_name",
            "subject_name",
            "class_assigned_name",
            "homework_title",
            # --- Fields for Writing (Creating/Updating) ---
            "teacher",
            "subject",
            "class_assigned",
            "homework",
        ]

        # The 'teacher' field is set in the view, not by the user directly
        read_only_fields = ["id", "status", "created_at", "teacher"]

        # Specify that 'subject', 'class_assigned', and 'homework' are write-only.
        # They will accept an ID but will not be part of the API output.
        # The read-only name fields above will be used in the output instead.
        extra_kwargs = {
            "subject": {"write_only": True},
            "class_assigned": {"write_only": True},
            "homework": {"write_only": True, "required": False, "allow_null": True},
        }


class TeacherProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Teacher
        fields = ["user", "teacher_id", "department", "role", "phone", "created_at"]


class PendingApprovalSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="class_assigned.name", read_only=True)
    teacher_name = serializers.CharField(
        source="teacher.user.get_full_name", read_only=True
    )
    formatted_date = serializers.SerializerMethodField()

    class Meta:
        model = TeacherReport
        fields = [
            "id",
            "period",
            "subject_name",
            "class_name",
            "activity",
            "teacher_name",
            "formatted_date",
            "status",
        ]

    def get_formatted_date(self, obj):
        return obj.created_at.strftime("%b %d, %Y")


class TeacherOverviewSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="user.get_full_name", read_only=True)
    department_name = serializers.CharField(source="department", read_only=True)
    pending_count = serializers.SerializerMethodField()
    teacher_id_display = serializers.CharField(source="teacher_id", read_only=True)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "teacher_name",
            "department_name",
            "pending_count",
            "teacher_id_display",
        ]

    def get_pending_count(self, obj):
        return obj.teacherreport_set.filter(status="pending").count()


class DashboardStatsSerializer(serializers.Serializer):
    total_teachers = serializers.IntegerField()
    pending_approvals = serializers.IntegerField()
    today_reports = serializers.IntegerField()


class TimetableDashboardSerializer(serializers.Serializer):
    pending_approvals = PendingApprovalSerializer(many=True)
    teachers_overview = TeacherOverviewSerializer(many=True)
    stats = DashboardStatsSerializer()
