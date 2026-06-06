import re

# Read the corrupted file
with open("core/views.py", "r", encoding="utf-8") as f:
    content = f.read()

# Find where RegisterView starts and VerifyEmailView starts
register_start = content.find("class RegisterView")
verify_start = content.find("class VerifyEmailView")

# Get the imports (everything before RegisterView)
imports = content[:register_start]

# Get VerifyEmailView and everything after
rest = content[verify_start:]

# Clean RegisterView implementation
clean_register = '''class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)

        # Generate 6-digit verification code
        verification_code = profile.generate_email_verification_code()

        # Send verification code via email
        try:
            from django.core.mail import EmailMultiAlternatives

            html_content = """<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 40px; text-align: center; }
        .logo { font-size: 28px; color: #2563eb; margin-bottom: 20px; }
        .code-box { background: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .code { font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; text-align: left; border-radius: 0 8px 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">□ WaaS</div>
            <h2>Welcome to WaaS!</h2>
            <p>Hi """ + str(user.first_name or user.username) + """</p>
            <p>Thank you for signing up! Enter the following code to verify your email address:</p>
            <div class="code-box">
                <div class="code">""" + verification_code + """</div>
            </div>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes. If you didn't create this account, please ignore this email.
            </div>
            <p>This code is required to complete your registration. Do not share it with anyone.</p>
            <div class="footer">
                <p>Best regards,<br>The WaaS Team</p>
            </div>
        </div>
    </div>
</body>
</html>"""

            text_content = "Welcome to WaaS!\n\nHi " + str(user.first_name or user.username) + ",\n\nThank you for signing up! Your verification code is: " + verification_code + "\n\nThis code will expire in 10 minutes.\nIf you didn't create this account, please ignore this email.\n\nBest regards,\nWaaS Team"

            msg = EmailMultiAlternatives(
                subject="Verify Your Email - WaaS",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL or "takougangfabrice83@gmail.com",
                to=[user.email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            print("Verification code sent to " + str(user.email) + ": " + verification_code)
        except Exception as e:
            print("Email sending failed: " + str(e))

        return Response(
            {
                "user": UserSerializer(user).data,
                "message": "Registration successful. Please check your email for the verification code.",
                "requires_verification": True,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )

'''

# Write the new file
new_content = imports + clean_register + rest

with open("core/views.py", "w", encoding="utf-8") as f:
    f.write(new_content)

print("File rewritten successfully!")
print(f"Total length: {len(new_content)} characters")
