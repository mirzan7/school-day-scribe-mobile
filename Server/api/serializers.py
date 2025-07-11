from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update({
            'user': {
                'id': str(self.user.id),
                'username': self.user.username,
                'role': self.user.role,
                'must_change_password': self.user.must_change_password,
            }
        })
        return data
