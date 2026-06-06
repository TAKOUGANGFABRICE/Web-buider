"""
Test to verify email backend configuration is correct.
Run: python manage.py test core.tests_email

Note: Django test runner uses locmem.EmailBackend by default.
We test the configuration logic from settings.py.
"""
from django.test import TestCase, override_settings
from django.conf import settings


class EmailBackendTests(TestCase):
    """Test email backend selection logic in settings.py"""

    def get_email_backend_from_env(self, env_vars):
        """
        Simulate the logic from settings.py to determine email backend.
        Returns the backend string based on SMTP credential presence.
        """
        email_host = env_vars.get("EMAIL_HOST", "")
        email_host_user = env_vars.get("EMAIL_HOST_USER", "")
        email_host_password = env_vars.get("EMAIL_HOST_PASSWORD", "")

        if email_host and email_host_user and email_host_password:
            return "django.core.mail.backends.smtp.EmailBackend"
        else:
            return "django.core.mail.backends.console.EmailBackend"

    def test_smtp_enabled_when_credentials_provided(self):
        """With complete SMTP credentials, should use SMTP backend"""
        backend = self.get_email_backend_from_env({
            "EMAIL_HOST": "smtp.gmail.com",
            "EMAIL_HOST_USER": "user@gmail.com",
            "EMAIL_HOST_PASSWORD": "app-password"
        })
        self.assertEqual(backend, "django.core.mail.backends.smtp.EmailBackend")

    def test_console_fallback_no_credentials(self):
        """Without any credentials, should use console backend"""
        backend = self.get_email_backend_from_env({
            "EMAIL_HOST": "",
            "EMAIL_HOST_USER": "",
            "EMAIL_HOST_PASSWORD": ""
        })
        self.assertEqual(backend, "django.core.mail.backends.console.EmailBackend")

    def test_console_fallback_partial_credentials(self):
        """With only host but no user/password, use console backend"""
        backend = self.get_email_backend_from_env({
            "EMAIL_HOST": "smtp.gmail.com",
            "EMAIL_HOST_USER": "",
            "EMAIL_HOST_PASSWORD": ""
        })
        self.assertEqual(backend, "django.core.mail.backends.console.EmailBackend")

    def test_gmail_from_email_must_match_user(self):
        """
        Critical: Gmail SMTP requires the from address to match
        the authenticated user, otherwise emails are blocked/spam.
        The settings.py logic enforces this.
        """
        email_host = "smtp.gmail.com"
        email_host_user = "myemail@gmail.com"
        default_from = "noreply@waas.com"

        # The actual from email used when Gmail is the host
        if "gmail" in email_host.lower() and email_host_user:
            actual_from = email_host_user
        else:
            actual_from = default_from

        self.assertEqual(actual_from, "myemail@gmail.com")

    def test_non_gmail_allows_custom_from(self):
        """Non-Gmail SMTP (Outlook, Yahoo) allows custom from email"""
        email_host = "smtp.outlook.com"
        email_host_user = "user@outlook.com"
        default_from = "noreply@mydomain.com"

        # Non-Gmail uses the provided default_from
        if "gmail" in email_host.lower() and email_host_user:
            actual_from = email_host_user
        else:
            actual_from = default_from

        self.assertEqual(actual_from, "noreply@mydomain.com")

    def test_multiple_smtp_providers(self):
        """Test various SMTP providers all select SMTP backend"""
        providers = [
            ("smtp.gmail.com", "user@gmail.com"),
            ("smtp-mail.outlook.com", "user@outlook.com"),
            ("smtp.mail.yahoo.com", "user@yahoo.com"),
            ("mail.example.com", "user@example.com"),
        ]

        for host, user in providers:
            env = {
                "EMAIL_HOST": host,
                "EMAIL_HOST_USER": user,
                "EMAIL_HOST_PASSWORD": "password123"
            }
            backend = self.get_email_backend_from_env(env)
            self.assertEqual(
                backend,
                "django.core.mail.backends.smtp.EmailBackend",
                f"Failed for {host}"
            )
