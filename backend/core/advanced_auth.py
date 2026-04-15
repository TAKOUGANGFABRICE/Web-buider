"""
Advanced Authentication Features Models
- Login history tracking
- Account lockout
- Session management
- Two-factor authentication
- Magic links
- CAPTCHA support
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random
import string
import hashlib
import os


class LoginHistory(models.Model):
    """Track user login history"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="login_history"
    )
    ip_address = models.CharField(max_length=45)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    login_time = models.DateTimeField(auto_now_add=True)
    login_successful = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    session_id = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["-login_time"]
        indexes = [
            models.Index(fields=["user", "-login_time"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.login_time}"


class FailedLoginAttempt(models.Model):
    """Track failed login attempts for lockout"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="failed_logins"
    )
    ip_address = models.CharField(max_length=45)
    attempt_time = models.DateTimeField(auto_now_add=True)
    attempts_count = models.IntegerField(default=1)
    is_locked = models.BooleanField(default=False)
    lockout_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-attempt_time"]

    def __str__(self):
        return f"{self.user.username} - {self.attempts_count} attempts"


class UserSession(models.Model):
    """Manage user sessions"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    session_key = models.CharField(max_length=100, unique=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    is_current = models.BooleanField(default=False)
    device_info = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["-last_activity"]

    def __str__(self):
        return f"{self.user.username} - {self.session_key[:20]}..."

    def is_expired(self):
        return timezone.now() > self.expires_at


class TwoFactorAuth(models.Model):
    """Two-factor authentication for users"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="two_factor"
    )
    is_enabled = models.BooleanField(default=False)
    secret_key = models.CharField(max_length=32, blank=True, null=True)
    backup_codes = models.JSONField(default=list)
    last_verified = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.user.username} - 2FA {'Enabled' if self.is_enabled else 'Disabled'}"
        )


class MagicLoginToken(models.Model):
    """Magic link tokens for password-less login"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="magic_tokens"
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    ip_address = models.CharField(max_length=45, blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - Token"

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at


def generate_captcha_code():
    """Generate a simple CAPTCHA code"""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class CaptchaModel(models.Model):
    """CAPTCHA for login protection"""

    code = models.CharField(max_length=10)
    image_data = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.CharField(max_length=45)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)

    def __str__(self):
        return f"CAPTCHA {self.code} - {self.created_at}"


class PasswordResetToken(models.Model):
    """Extended password reset tokens with more features"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    token_type = models.CharField(
        max_length=20, default="password_reset"
    )  # password_reset, email_change, account_delete

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.token_type}"

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at


class LoginAttemptLockout(models.Model):
    """Track IP-based lockouts for brute force protection"""

    ip_address = models.CharField(max_length=45, unique=True)
    attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"IP {self.ip_address} - {self.attempts} attempts"

    def is_locked(self):
        return self.locked_until and timezone.now() < self.locked_until


def validate_password_strength(password):
    """Validate password meets strength requirements"""
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    if any(c in string.punctuation for c in password):
        errors.append("Password should contain special characters for better security")

    return len(errors) == 0, errors


def generate_magic_token():
    """Generate a secure magic link token"""
    return hashlib.sha256(os.urandom(32)).hexdigest()


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip
