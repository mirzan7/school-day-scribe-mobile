from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from .models import User

class CustomUserCreationForm(forms.ModelForm):
    """Form for creating new users from admin with default password '1234'."""

    class Meta:
        model = User
        fields = ("username", "role")

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password("1234")  # default password
        user.must_change_password = True
        if commit:
            user.save()
        return user
