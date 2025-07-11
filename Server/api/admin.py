from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from .forms import CustomUserCreationForm

class CustomUserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    model = User
    list_display = ("username", "role", "is_staff", "must_change_password")
    list_filter = ("role", "is_staff")
    
    fieldsets = (
        (None, {"fields": ("username", "role", "password")}),
        ("Permissions", {"fields": ("is_staff", "is_superuser", "is_active", "groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "role"),  # remove password fields
        }),
    )

    search_fields = ("username",)
    ordering = ("username",)

admin.site.register(User, CustomUserAdmin)
