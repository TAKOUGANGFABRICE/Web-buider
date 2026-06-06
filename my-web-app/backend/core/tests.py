"""
Basic tests for core functionality after removing email verification.
Run: python manage.py test core.tests
"""
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status


class RegistrationTests(TestCase):
    """Test user registration without email verification"""

    def test_registration_successful(self):
        """Test that a user can register successfully"""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "first_name": "New",
            "last_name": "User",
        }
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["message"], "Registration successful")

        # Verify user created
        user = User.objects.get(username="newuser")
        self.assertIsNotNone(user)
        self.assertFalse(user.profile.is_email_verified)  # Default false

    def test_registration_without_recaptcha_in_dev(self):
        """In development, registration works even without reCAPTCHA token"""
        # With no RECAPTCHA_SECRET_KEY configured, token not required
        data = {
            "username": "devuser",
            "email": "dev@example.com",
            "password": "DevPass123!",
        }
        response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_login_after_registration(self):
        """Test that user can log in immediately after registration"""
        data = {
            "username": "loginuser",
            "email": "login@example.com",
            "password": "LoginPass123!",
        }
        reg_response = self.client.post("/api/register/", data, format="json")
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)

        # Login
        login_data = {
            "username": "loginuser",
            "password": "LoginPass123!",
        }
        login_response = self.client.post("/api/login/", login_data, format="json")
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)
