from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User
from homework.models import Teacher


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update(
            {
                "user": {
                    "id": str(self.user.id),
                    "username": self.user.username,
                    "role": self.user.role,
                    "must_change_password": self.user.must_change_password,
                }
            }
        )
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
        fields = ['user', 'teacher_id', 'department', 'role', 'phone']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        teacher = Teacher.objects.create(user=user, **validated_data)
        return teacher

