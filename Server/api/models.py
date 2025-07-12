from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
import uuid
# from homework.models import Class,Teacher,

# BaseModel with UUID and timestamps
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# Custom User Manager
class UserManager(BaseUserManager):
    def create_user(self, username, password=None, role="teacher", **extra_fields):
        if not username:
            raise ValueError("Username is required")
        user = self.model(username=username, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, role="admin", **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(username, password, role, **extra_fields)


# Custom User Model
class User(BaseModel, AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("teacher", "Teacher"),
        ("principal", "Principal"),
        ("admin", "Admin"),
    )

    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    must_change_password = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["role"]

    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def get_full_name(self):
        return f"{self.username}"  


# class AddTeacher(API)