from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer, TeacherSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
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
        return Response({"detail": "Password changed successfully."}, status=200)
    