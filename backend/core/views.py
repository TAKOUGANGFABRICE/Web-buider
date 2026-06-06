from rest_framework import generics, permissions, viewsets, status, parsers
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from datetime import timedelta
from .models import (
    Website,
    BillingPlan,
    BillingPlanFeature,
    UserBillingPlan,
    Template,
    UserTemplate,
    TemplatePurchase,
    TemplateOrder,
    UserProfile,
    MediaImage,
)
from .advanced_auth import (
    LoginHistory,
    FailedLoginAttempt,
    UserSession,
    TwoFactorAuth,
    MagicLoginToken,
    LoginAttemptLockout,
)
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    WebsiteSerializer,
    BillingPlanSerializer,
    UserBillingPlanSerializer,
    UserBillingPlanSelectSerializer,
    TemplateSerializer,
    TemplateDetailSerializer,
    UserTemplateSerializer,
    TemplatePurchaseSerializer,
    TemplateOrderSerializer,
    TemplateOrderCreateSerializer,
    EmailVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    SocialLoginSerializer,
    UserProfileSerializer,
)
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView


class RegisterView(generics.CreateAPIView):
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

        try:
            token = profile.generate_email_verification_token()
            profile.save()

            verification_url = f"{settings.FRONTEND_URL or 'http://localhost:3001'}/verify-email?token={token}"

            send_mail(
                subject="Verify your email address",
                message=f"Welcome! Please verify your email by clicking this link: {verification_url}",
                from_email=settings.DEFAULT_FROM_EMAIL or "noreply@websitebuilder.com",
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email sending failed: {e}")

        return Response(
            {
                "user": UserSerializer(user).data,
                "message": "Registration successful. Please check your email to verify your account.",
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]

        try:
            profile = UserProfile.objects.get(email_verification_token=token)
            profile.is_email_verified = True
            profile.email_verification_token = ""
            profile.save()

            return Response({"message": "Email verified successfully"})
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Invalid or expired verification token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        profile = user.profile

        if profile.is_email_verified:
            return Response(
                {"message": "Email is already verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = profile.generate_email_verification_token()
        profile.save()

        verification_url = f"{settings.FRONTEND_URL or 'http://localhost:3001'}/verify-email?token={token}"

        send_mail(
            subject="Verify your email address",
            message=f"Please verify your email by clicking this link: {verification_url}",
            from_email=settings.DEFAULT_FROM_EMAIL or "noreply@websitebuilder.com",
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"message": "Verification email sent"})


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
            profile = user.profile
            token = profile.generate_password_reset_token()
            profile.save()

            reset_url = f"{settings.FRONTEND_URL or 'http://localhost:3001'}/reset-password?token={token}"

            send_mail(
                subject="Reset your password",
                message=f"Click here to reset your password: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL or "noreply@websitebuilder.com",
                recipient_list=[email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            pass  # Don't reveal if email exists

        return Response({"message": "If the email exists, a reset link has been sent"})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            profile = UserProfile.objects.get(password_reset_token=token)
            if not profile.is_password_reset_valid():
                return Response(
                    {"error": "Token has expired"}, status=status.HTTP_400_BAD_REQUEST
                )

            user = profile.user
            user.set_password(new_password)
            user.save()

            profile.password_reset_token = ""
            profile.password_reset_expires = None
            profile.save()

            return Response({"message": "Password reset successfully"})
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class SocialLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provider = serializer.validated_data["provider"]
        access_token = serializer.validated_data["access_token"]

        if provider == "google":
            return self.handle_google_login(access_token, request)
        elif provider == "facebook":
            return self.handle_facebook_login(access_token, request)

    def handle_google_login(self, access_token, request):
        import requests

        try:
            # Verify Google token
            google_response = requests.get(
                f"https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if google_response.status_code != 200:
                return Response(
                    {"error": "Invalid Google token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            google_user = google_response.json()
            email = google_user.get("email")
            google_id = google_user.get("sub")

            if not email:
                return Response(
                    {"error": "Could not get email from Google"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Find or create user
            profile = UserProfile.objects.filter(google_id=google_id).first()

            if profile:
                user = profile.user
            else:
                # Check if user with this email exists
                user = User.objects.filter(email=email).first()

                if user:
                    # Link existing account
                    profile = user.profile
                    profile.google_id = google_id
                    profile.is_email_verified = True
                    profile.save()
                else:
                    # Create new user
                    username = email.split("@")[0]
                    # Ensure unique username
                    base_username = username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1

                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=None,  # No password for social login
                    )
                    user.first_name = google_user.get("given_name", "")
                    user.last_name = google_user.get("family_name", "")
                    user.save()

                    profile = UserProfile.objects.create(
                        user=user,
                        google_id=google_id,
                        is_email_verified=True,
                        avatar=google_user.get("picture"),
                    )

            # Generate JWT tokens
            from rest_framework_simplejwt.tokens import RefreshToken

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Google login failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def handle_facebook_login(self, access_token, request):
        import requests

        try:
            # Verify Facebook token
            fb_response = requests.get(
                f"https://graph.facebook.com/me",
                params={
                    "fields": "id,email,first_name,last_name,picture",
                    "access_token": access_token,
                },
            )

            if fb_response.status_code != 200:
                return Response(
                    {"error": "Invalid Facebook token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            fb_user = fb_response.json()
            email = fb_user.get("email")
            facebook_id = fb_user.get("id")

            if not email:
                return Response(
                    {"error": "Please grant email permission to login"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Find or create user
            profile = UserProfile.objects.filter(facebook_id=facebook_id).first()

            if profile:
                user = profile.user
            else:
                user = User.objects.filter(email=email).first()

                if user:
                    profile = user.profile
                    profile.facebook_id = facebook_id
                    profile.is_email_verified = True
                    profile.save()
                else:
                    username = email.split("@")[0]
                    base_username = username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1

                    user = User.objects.create_user(
                        username=username, email=email, password=None
                    )
                    user.first_name = fb_user.get("first_name", "")
                    user.last_name = fb_user.get("last_name", "")
                    user.save()

                    picture = fb_user.get("picture", {})
                    avatar_url = (
                        picture.get("data", {}).get("url")
                        if isinstance(picture, dict)
                        else None
                    )

                    profile = UserProfile.objects.create(
                        user=user,
                        facebook_id=facebook_id,
                        is_email_verified=True,
                        avatar=avatar_url,
                    )

            from rest_framework_simplejwt.tokens import RefreshToken

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Facebook login failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current user's profile"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LoginView(APIView):
    """Custom login view with advanced security features"""

    permission_classes = [permissions.AllowAny]

    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15

    def post(self, request):
        from django.contrib.auth import authenticate
        from rest_framework_simplejwt.tokens import RefreshToken
        from core.advanced_auth import (
            LoginHistory,
            FailedLoginAttempt,
            UserSession,
            LoginAttemptLockout,
        )

        username = request.data.get("username")
        password = request.data.get("password")
        remember_me = request.data.get("remember_me", False)

        # Check IP-based lockout
        client_ip = self.get_client_ip(request)
        ip_lockout = LoginAttemptLockout.objects.filter(ip_address=client_ip).first()
        if ip_lockout and ip_lockout.is_locked():
            return Response(
                {
                    "error": "Too many failed attempts. Please try again later.",
                    "locked": True,
                    "retry_after": int(
                        (ip_lockout.locked_until - timezone.now()).total_seconds()
                    ),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if not username or not password:
            return Response(
                {"error": "Please provide both username and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check user-based lockout
        try:
            user_obj = User.objects.get(username=username)
            failed_attempt = FailedLoginAttempt.objects.filter(user=user_obj).first()

            if failed_attempt and failed_attempt.is_locked:
                if (
                    failed_attempt.lockout_until
                    and timezone.now() < failed_attempt.lockout_until
                ):
                    return Response(
                        {
                            "error": f"Account locked. Try again after {failed_attempt.lockout_until.strftime('%H:%M')}",
                            "locked": True,
                            "reason": "Too many failed login attempts",
                        },
                        status=status.HTTP_423_LOCKED,
                    )
        except User.DoesNotExist:
            pass

        user = authenticate(username=username, password=password)

        if user is None:
            # Record failed login attempt
            self.record_failed_login(
                username, client_ip, request.META.get("HTTP_USER_AGENT", "")
            )
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check if user is active
        if not user.is_active:
            LoginHistory.objects.create(
                user=user,
                ip_address=client_ip,
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                login_successful=False,
                failure_reason="Account disabled",
            )
            return Response(
                {"error": "User account is disabled"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check if 2FA is enabled
        from core.advanced_auth import TwoFactorAuth

        two_fa = TwoFactorAuth.objects.filter(user=user, is_enabled=True).first()

        if two_fa and not request.data.get("2fa_code"):
            # Return that 2FA is required
            return Response(
                {"requires_2fa": True, "message": "Please enter your 2FA code"},
                status=status.HTTP_200_OK,
            )

        # Generate JWT tokens
        if remember_me:
            # Extended token for "remember me"
            refresh = RefreshToken.for_user(user)
            refresh.set_exp(lifetime=timedelta(days=30))
        else:
            refresh = RefreshToken.for_user(user)

        # Record successful login
        self.record_successful_login(
            user, client_ip, request.META.get("HTTP_USER_AGENT", ""), remember_me
        )

        # Clear failed login attempts
        FailedLoginAttempt.objects.filter(user=user).delete()
        if ip_lockout:
            ip_lockout.attempts = 0
            ip_lockout.save()

        # Send login notification email
        try:
            profile = user.profile if hasattr(user, "profile") else None
            if profile and profile.email_notifications:
                send_mail(
                    subject="🔐 New Login to Your Account",
                    message=f"""Hello {user.first_name or user.username},

A new login was detected on your WaaS account.

📧 Email: {user.email}
🕐 Time: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}
🌐 IP: {client_ip}
🔐 Device: {"Remembered" if remember_me else "Standard Session"}

If this was you, no action is needed. If you didn't log in, please change your password immediately.

Best regards,
WaaS Team
""",
                    from_email=settings.DEFAULT_FROM_EMAIL
                    or "noreply@websitebuilder.com",
                    recipient_list=[user.email],
                    fail_silently=True,
                )
        except Exception as e:
            print(f"Login notification email failed: {e}")

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
                "remember_me": remember_me,
            }
        )

    def record_failed_login(self, username, ip_address, user_agent):
        """Record failed login attempt and lock if too many"""
        try:
            user = User.objects.get(username=username)
            failed_attempt, created = FailedLoginAttempt.objects.get_or_create(
                user=user, defaults={"ip_address": ip_address}
            )

            failed_attempt.attempts_count += 1
            failed_attempt.attempt_time = timezone.now()
            failed_attempt.ip_address = ip_address

            if failed_attempt.attempts_count >= self.MAX_LOGIN_ATTEMPTS:
                failed_attempt.is_locked = True
                failed_attempt.lockout_until = timezone.now() + timedelta(
                    minutes=self.LOCKOUT_DURATION_MINUTES
                )

            failed_attempt.save()

            # Also track IP-based attempts
            ip_lockout, _ = LoginAttemptLockout.objects.get_or_create(
                ip_address=ip_address
            )
            ip_lockout.attempts += 1
            if ip_lockout.attempts >= 10:  # 10 attempts from same IP
                ip_lockout.locked_until = timezone.now() + timedelta(minutes=30)
            ip_lockout.save()

        except User.DoesNotExist:
            pass

    def record_successful_login(self, user, ip_address, user_agent, remember_me):
        """Record successful login"""
        # Login history
        LoginHistory.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            login_successful=True,
        )

        # Session (if remember me)
        if remember_me:
            import uuid

            session_key = str(uuid.uuid4())
            expires = timezone.now() + timedelta(days=30)
            UserSession.objects.create(
                user=user,
                session_key=session_key,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=expires,
                is_current=True,
                device_info=self.get_device_info(user_agent),
            )

    def get_device_info(self, user_agent):
        """Parse user agent for device info"""
        if not user_agent:
            return "Unknown"

        if "Mobile" in user_agent:
            return "Mobile Device"
        elif "Tablet" in user_agent:
            return "Tablet"
        else:
            return "Desktop"

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class WebsiteViewSet(viewsets.ModelViewSet):
    serializer_class = WebsiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Website.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return WebsiteSerializer
        return WebsiteSerializer

    def perform_create(self, serializer):
        from core.plan_checker import check_website_limit

        # Check website limit based on plan
        limit_check = check_website_limit(self.request.user)
        if not limit_check["allowed"]:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(limit_check["message"])

        website = serializer.save(owner=self.request.user)
        page_elements = self.request.data.get("page_elements", [])
        self._save_page_elements(website, page_elements)

    def perform_update(self, serializer):
        website = serializer.save()
        page_elements = self.request.data.get("page_elements", [])
        self._save_page_elements(website, page_elements)

    def _save_page_elements(self, website, page_elements):
        from core.models import PageElement

        if page_elements:
            PageElement.objects.filter(website=website).delete()
            for idx, elem in enumerate(page_elements):
                PageElement.objects.create(
                    website=website,
                    page_name=elem.get("page_name", "index"),
                    element_type=elem.get("element_type", "text"),
                    element_data=elem.get("element_data", {}),
                    position=elem.get("position", idx),
                    is_visible=elem.get("is_visible", True),
                )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        data["page_elements"] = list(
            instance.page_elements.all().values(
                "id",
                "page_name",
                "element_type",
                "element_data",
                "position",
                "is_visible",
            )
        )
        return Response(data)


# Billing Plan Views


class BillingPlanListView(generics.ListAPIView):
    """List all available billing plans"""

    queryset = BillingPlan.objects.filter(is_active=True)
    serializer_class = BillingPlanSerializer
    permission_classes = [permissions.AllowAny]


class UserBillingPlanView(generics.RetrieveUpdateAPIView):
    """Get or update user's selected billing plan"""

    serializer_class = UserBillingPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user_billing_plan, created = UserBillingPlan.objects.get_or_create(
            user=self.request.user
        )
        return user_billing_plan


class UserPlanInfoView(APIView):
    """Get comprehensive plan info for current user"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from core.plan_checker import get_plan_info
        from core.models import Website

        info = get_plan_info(request.user)

        # Get website list for current user
        websites = Website.objects.filter(owner=request.user).values(
            "id", "name", "is_published", "created_at"
        )

        info["websites"] = list(websites)

        return Response(info)


class SelectBillingPlanView(generics.GenericAPIView):
    """Select a billing plan after signup/login"""

    serializer_class = UserBillingPlanSelectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = serializer.validated_data["plan_id"]
        user_billing_plan = UserBillingPlan.objects.get(user=request.user)
        user_billing_plan.plan = plan
        user_billing_plan.has_selected_plan = True
        user_billing_plan.selected_at = timezone.now()
        user_billing_plan.save()

        return Response(
            {
                "message": "Billing plan selected successfully",
                "billing_plan": UserBillingPlanSerializer(user_billing_plan).data,
            }
        )


class CheckPlanSelectionView(generics.GenericAPIView):
    """Check if user has selected a billing plan"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_billing_plan = UserBillingPlan.objects.get(user=request.user)
            return Response(
                {
                    "has_selected_plan": user_billing_plan.has_selected_plan,
                    "billing_plan": UserBillingPlanSerializer(user_billing_plan).data
                    if user_billing_plan.has_selected_plan
                    else None,
                }
            )
        except UserBillingPlan.DoesNotExist:
            return Response({"has_selected_plan": False, "billing_plan": None})


# Template Views


class TemplateListView(generics.ListAPIView):
    """List all available templates"""

    serializer_class = TemplateSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Template.objects.filter(is_active=True)

        # Filter by category if provided
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        # Filter by free templates
        free_only = self.request.query_params.get("free")
        if free_only == "true":
            queryset = queryset.filter(is_free=True)

        # Filter by premium templates
        premium_only = self.request.query_params.get("premium")
        if premium_only == "true":
            queryset = queryset.filter(is_premium=True)

        return queryset


class TemplateDetailView(generics.RetrieveAPIView):
    """Get template details including content (for authenticated users who own it or for preview)"""

    queryset = Template.objects.filter(is_active=True)
    serializer_class = TemplateDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class UserTemplateViewSet(viewsets.ModelViewSet):
    """Manage user's purchased templates"""

    serializer_class = UserTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserTemplate.objects.filter(user=self.request.user)

    def create(self, request):
        """Create a copy of a template for the user (purchase/claim)"""
        template_id = request.data.get("template_id")
        custom_name = request.data.get("name", "")

        try:
            template = Template.objects.get(id=template_id, is_active=True)
        except Template.DoesNotExist:
            return Response(
                {"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user already owns this template
        if UserTemplate.objects.filter(user=request.user, template=template).exists():
            return Response(
                {"error": "You already own this template"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create user template copy
        user_template = UserTemplate.objects.create(
            user=request.user,
            template=template,
            name=custom_name or f"My {template.name}",
            content=template.template_file,
        )

        # Create purchase record
        TemplatePurchase.objects.create(
            user=request.user,
            template=template,
            user_template=user_template,
            amount=template.price if not template.is_free else 0,
            payment_status="completed" if template.is_free else "pending",
        )

        return Response(
            UserTemplateSerializer(user_template).data, status=status.HTTP_201_CREATED
        )


class TemplatePurchaseView(generics.GenericAPIView):
    """Purchase a template"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        template_id = request.data.get("template_id")

        try:
            template = Template.objects.get(id=template_id, is_active=True)
        except Template.DoesNotExist:
            return Response(
                {"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user already owns this template
        if UserTemplate.objects.filter(user=request.user, template=template).exists():
            return Response(
                {"error": "You already own this template"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If template is free, create it immediately
        if template.is_free:
            user_template = UserTemplate.objects.create(
                user=request.user,
                template=template,
                name=f"My {template.name}",
                content=template.template_file,
            )
            TemplatePurchase.objects.create(
                user=request.user,
                template=template,
                user_template=user_template,
                amount=0,
                payment_status="completed",
            )
            return Response(
                {
                    "message": "Template purchased successfully",
                    "user_template": UserTemplateSerializer(user_template).data,
                }
            )

        # For paid templates, create pending purchase (payment handled separately)
        purchase = TemplatePurchase.objects.create(
            user=request.user,
            template=template,
            amount=template.price,
            payment_status="pending",
        )

        return Response(
            {
                "message": "Purchase initiated",
                "purchase_id": str(purchase.id),
                "amount": str(purchase.amount),
                "template": TemplateSerializer(template).data,
            }
        )


class TemplateOrderViewSet(viewsets.ModelViewSet):
    """Manage custom template orders"""

    serializer_class = TemplateOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TemplateOrder.objects.filter(user=self.request.user)

    def create(self, request):
        """Create a new template order (generates invoice)"""
        serializer = TemplateOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check if user can order custom templates
        try:
            user_plan = UserBillingPlan.objects.get(user=request.user)
            if user_plan.plan and not user_plan.plan.can_order_custom_template:
                return Response(
                    {
                        "error": "Your plan does not allow custom template orders. Please upgrade your plan."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        except UserBillingPlan.DoesNotExist:
            pass

        order = TemplateOrder.objects.create(
            user=request.user, **serializer.validated_data
        )

        return Response(
            TemplateOrderSerializer(order).data, status=status.HTTP_201_CREATED
        )


class WebsiteTeamView(APIView):
    """Manage team members for a website"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, website_id):
        from core.models import TeamMember

        try:
            website = Website.objects.get(id=website_id, owner=request.user)
        except Website.DoesNotExist:
            return Response(
                {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
            )

        team_members = TeamMember.objects.filter(website=website).select_related("user")
        data = []
        for member in team_members:
            data.append(
                {
                    "id": member.id,
                    "username": member.user.username,
                    "email": member.user.email,
                    "role": member.role,
                    "invited_by": member.invited_by.username
                    if member.invited_by
                    else None,
                    "invited_at": member.invited_at.isoformat()
                    if member.invited_at
                    else None,
                    "is_active": member.is_active,
                }
            )
        return Response(data)

    def post(self, request, website_id):
        from core.models import TeamMember
        from django.contrib.auth.models import User

        try:
            website = Website.objects.get(id=website_id, owner=request.user)
        except Website.DoesNotExist:
            return Response(
                {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
            )

        email = request.data.get("email")
        role = request.data.get("role", "editor")

        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found with this email"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user == request.user:
            return Response(
                {"error": "Cannot invite yourself"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already a member
        if TeamMember.objects.filter(website=website, user=user).exists():
            return Response(
                {"error": "User is already a team member"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check plan limits for team members
        from core.plan_checker import check_team_members

        team_check = check_team_members(request.user)
        if not team_check["allowed"]:
            return Response(
                {
                    "error": "Your plan does not include team members. Upgrade to access this feature."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        current_members = TeamMember.objects.filter(website=website).count()
        if team_check["max"] != -1 and current_members >= team_check["max"]:
            return Response(
                {
                    "error": f"You have reached the maximum of {team_check['max']} team members. Upgrade your plan to add more."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        member = TeamMember.objects.create(
            website=website,
            user=user,
            role=role,
            invited_by=request.user,
            is_active=True,
        )

        return Response(
            {
                "id": member.id,
                "username": user.username,
                "email": user.email,
                "role": member.role,
                "message": "Team member added successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class WebsiteTeamMemberView(APIView):
    """Manage individual team member"""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, website_id, member_id):
        from core.models import TeamMember

        try:
            website = Website.objects.get(id=website_id, owner=request.user)
        except Website.DoesNotExist:
            return Response(
                {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            member = TeamMember.objects.get(id=member_id, website=website)
        except TeamMember.DoesNotExist:
            return Response(
                {"error": "Team member not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if member.role == "owner":
            return Response(
                {"error": "Cannot modify owner role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_role = request.data.get("role")
        if new_role:
            member.role = new_role
            member.save()

        return Response(
            {
                "id": member.id,
                "username": member.user.username,
                "email": member.user.email,
                "role": member.role,
            }
        )

    def delete(self, request, website_id, member_id):
        from core.models import TeamMember

        try:
            website = Website.objects.get(id=website_id, owner=request.user)
        except Website.DoesNotExist:
            return Response(
                {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
            )

        try:
            member = TeamMember.objects.get(id=member_id, website=website)
        except TeamMember.DoesNotExist:
            return Response(
                {"error": "Team member not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if member.role == "owner":
            return Response(
                {"error": "Cannot remove owner"}, status=status.HTTP_400_BAD_REQUEST
            )

        member.delete()
        return Response({"message": "Team member removed successfully"})


class PublicWebsiteView(APIView):
    """Public view for published websites"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, website_id=None):
        if website_id:
            try:
                website = Website.objects.get(id=website_id, is_published=True)
            except Website.DoesNotExist:
                return Response(
                    {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            slug = request.query_params.get("slug")
            subdomain = request.query_params.get("subdomain")

            if slug:
                try:
                    website = Website.objects.get(slug=slug, is_published=True)
                except Website.DoesNotExist:
                    return Response(
                        {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
                    )
            elif subdomain:
                try:
                    website = Website.objects.get(
                        subdomain=subdomain, is_published=True
                    )
                except Website.DoesNotExist:
                    return Response(
                        {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {"error": "Please provide website_id, slug, or subdomain"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        page_elements = website.page_elements.filter(is_visible=True).order_by(
            "position"
        )

        return Response(
            {
                "id": website.id,
                "name": website.name,
                "slug": website.slug,
                "subdomain": website.subdomain,
                "custom_domain": website.custom_domain,
                "seo_title": website.seo_title,
                "seo_description": website.seo_description,
                "page_elements": list(
                    page_elements.values(
                        "id", "page_name", "element_type", "element_data", "position"
                    )
                ),
            }
        )


# ============================================
# Advanced Authentication Views
# ============================================


class LoginHistoryView(APIView):
    """Get user's login history"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from core.advanced_auth import LoginHistory

        limit = int(request.query_params.get("limit", 20))
        logins = LoginHistory.objects.filter(user=request.user)[:limit]

        data = []
        for login in logins:
            data.append(
                {
                    "id": login.id,
                    "ip_address": login.ip_address,
                    "user_agent": login.user_agent,
                    "login_time": login.login_time.isoformat(),
                    "login_successful": login.login_successful,
                    "location": login.location,
                }
            )

        return Response(data)


class UserSessionsView(APIView):
    """Get user's active sessions"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from core.advanced_auth import UserSession

        sessions = UserSession.objects.filter(user=request.user, is_current=True)

        data = []
        for session in sessions:
            data.append(
                {
                    "id": session.id,
                    "device_info": session.device_info,
                    "ip_address": session.ip_address,
                    "created_at": session.created_at.isoformat(),
                    "last_activity": session.last_activity.isoformat(),
                    "expires_at": session.expires_at.isoformat(),
                }
            )

        return Response(data)


class RevokeSessionView(APIView):
    """Revoke a specific session"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_id):
        from core.advanced_auth import UserSession

        try:
            session = UserSession.objects.get(id=session_id, user=request.user)
            session.delete()
            return Response({"message": "Session revoked successfully"})
        except UserSession.DoesNotExist:
            return Response(
                {"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND
            )


class TwoFactorSetupView(APIView):
    """Setup 2FA for user"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from core.advanced_auth import TwoFactorAuth
        import pyotp
        import secrets

        # Generate secret key
        secret = pyotp.random_base32()

        # Create or update 2FA
        two_fa, created = TwoFactorAuth.objects.get_or_create(user=request.user)
        two_fa.secret_key = secret
        two_fa.is_enabled = False  # Not enabled until verified
        two_fa.save()

        # Generate QR code URL (for authenticator apps)
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=request.user.email, issuer_name="WaaS"
        )

        return Response(
            {
                "secret": secret,
                "qr_url": provisioning_uri,
                "message": "Scan the QR code with your authenticator app, then verify with a code",
            }
        )


class TwoFactorVerifyView(APIView):
    """Verify and enable 2FA"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from core.advanced_auth import TwoFactorAuth
        import pyotp

        code = request.data.get("code")

        try:
            two_fa = TwoFactorAuth.objects.get(user=request.user)
            totp = pyotp.TOTP(two_fa.secret_key)

            if totp.verify(code):
                two_fa.is_enabled = True
                two_fa.last_verified = timezone.now()
                two_fa.save()

                # Generate backup codes
                import random
                import string

                backup_codes = [
                    "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
                    for _ in range(10)
                ]
                two_fa.backup_codes = backup_codes
                two_fa.save()

                return Response(
                    {
                        "success": True,
                        "message": "2FA enabled successfully",
                        "backup_codes": backup_codes,
                    }
                )
            else:
                return Response(
                    {"error": "Invalid code. Please try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except TwoFactorAuth.DoesNotExist:
            return Response(
                {"error": "2FA not set up yet"}, status=status.HTTP_400_BAD_REQUEST
            )


class TwoFactorDisableView(APIView):
    """Disable 2FA"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from django.contrib.auth import authenticate
        from core.advanced_auth import TwoFactorAuth

        password = request.data.get("password")
        user = authenticate(username=request.user.username, password=password)

        if not user:
            return Response(
                {"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            two_fa = TwoFactorAuth.objects.get(user=request.user)
            two_fa.is_enabled = False
            two_fa.secret_key = None
            two_fa.save()

            return Response({"success": True, "message": "2FA disabled successfully"})
        except TwoFactorAuth.DoesNotExist:
            return Response(
                {"error": "2FA not enabled"}, status=status.HTTP_400_BAD_REQUEST
            )


class MagicLoginRequestView(APIView):
    """Request magic login link"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from core.advanced_auth import MagicLoginToken, generate_magic_token

        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            # Generate token
            token = generate_magic_token()
            expires = timezone.now() + timedelta(minutes=15)
            ip_address = self.get_client_ip(request)

            MagicLoginToken.objects.create(
                user=user, token=token, expires_at=expires, ip_address=ip_address
            )

            # Send magic link email (in production, this would be a real email)
            magic_link = f"{settings.FRONTEND_URL}/magic-login?token={token}"

            send_mail(
                subject="🔗 Your Magic Login Link",
                message=f"""Hello {user.first_name or user.username},

Use this link to login to your WaaS account:

{magic_link}

This link will expire in 15 minutes.

If you didn't request this, you can safely ignore this email.

Best regards,
WaaS Team
""",
                from_email=settings.DEFAULT_FROM_EMAIL or "noreply@websitebuilder.com",
                recipient_list=[user.email],
                fail_silently=True,
            )

            return Response(
                {"success": True, "message": "Magic login link sent to your email"}
            )

        except User.DoesNotExist:
            # Don't reveal if email exists
            return Response(
                {
                    "success": True,
                    "message": "If an account exists, a magic link has been sent",
                }
            )

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class MagicLoginVerifyView(APIView):
    """Verify magic login token"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from core.advanced_auth import MagicLoginToken
        from rest_framework_simplejwt.tokens import RefreshToken

        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            magic_token = MagicLoginToken.objects.get(token=token)

            if not magic_token.is_valid():
                return Response(
                    {"error": "Invalid or expired token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Mark as used
            magic_token.used = True
            magic_token.save()

            # Generate tokens for user
            user = magic_token.user
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                }
            )

        except MagicLoginToken.DoesNotExist:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


# ============================================
# Media Gallery Views
# ============================================


class MediaImageListCreateView(APIView):
    """List and create user images"""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request):
        images = MediaImage.objects.filter(user=request.user)
        data = []
        for img in images:
            data.append(
                {
                    "id": img.id,
                    "name": img.name,
                    "image_url": request.build_absolute_uri(img.image.url)
                    if img.image
                    else img.image_url,
                    "file_size": img.file_size,
                    "width": img.width,
                    "height": img.height,
                    "alt_text": img.alt_text,
                    "created_at": img.created_at.isoformat(),
                }
            )
        return Response(data)

    def post(self, request):
        image_file = request.FILES.get("image")
        name = request.data.get("name", image_file.name if image_file else "Untitled")

        if not image_file:
            return Response(
                {"error": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
        ]
        if image_file.content_type not in allowed_types:
            return Response(
                {"error": "Invalid image type. Allowed: JPEG, PNG, GIF, WebP, SVG"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (5MB max)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "Image file too large. Maximum size is 5MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from PIL import Image
            from io import BytesIO

            # Get image dimensions
            img = Image.open(image_file)
            width, height = img.size

            # Reset file pointer
            image_file.seek(0)

            media_image = MediaImage.objects.create(
                user=request.user,
                name=name,
                image=image_file,
                file_size=image_file.size,
                width=width,
                height=height,
                mime_type=image_file.content_type,
            )

            return Response(
                {
                    "id": media_image.id,
                    "name": media_image.name,
                    "image_url": request.build_absolute_uri(media_image.image.url),
                    "file_size": media_image.file_size,
                    "width": media_image.width,
                    "height": media_image.height,
                    "created_at": media_image.created_at.isoformat(),
                },
                status=status.HTTP_201_CREATED,
            )

        except ImportError:
            # If PIL not available, just save without dimensions
            media_image = MediaImage.objects.create(
                user=request.user,
                name=name,
                image=image_file,
                file_size=image_file.size,
                mime_type=image_file.content_type,
            )

            return Response(
                {
                    "id": media_image.id,
                    "name": media_image.name,
                    "image_url": request.build_absolute_uri(media_image.image.url),
                    "file_size": media_image.file_size,
                    "created_at": media_image.created_at.isoformat(),
                },
                status=status.HTTP_201_CREATED,
            )


class MediaImageDetailView(APIView):
    """Get, update, or delete a single image"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, image_id):
        try:
            image = MediaImage.objects.get(id=image_id, user=request.user)
        except MediaImage.DoesNotExist:
            return Response(
                {"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "id": image.id,
                "name": image.name,
                "image_url": request.build_absolute_uri(image.image.url),
                "file_size": image.file_size,
                "width": image.width,
                "height": image.height,
                "alt_text": image.alt_text,
                "created_at": image.created_at.isoformat(),
            }
        )

    def patch(self, request, image_id):
        try:
            image = MediaImage.objects.get(id=image_id, user=request.user)
        except MediaImage.DoesNotExist:
            return Response(
                {"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND
            )

        name = request.data.get("name")
        alt_text = request.data.get("alt_text")

        if name:
            image.name = name
        if alt_text is not None:
            image.alt_text = alt_text

        image.save()

        return Response(
            {
                "id": image.id,
                "name": image.name,
                "image_url": request.build_absolute_uri(image.image.url),
                "alt_text": image.alt_text,
            }
        )

    def delete(self, request, image_id):
        try:
            image = MediaImage.objects.get(id=image_id, user=request.user)
        except MediaImage.DoesNotExist:
            return Response(
                {"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Delete the file
        if image.image:
            image.image.delete()

        image.delete()

        return Response({"message": "Image deleted successfully"})
