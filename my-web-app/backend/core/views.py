from rest_framework import generics, permissions, viewsets, status, parsers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from datetime import timedelta
import xml.etree.ElementTree as ET
from io import BytesIO
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
    Domain,
    Page,
    PageElement,
    BlogPost,
    Product,
    SeoSettings,
    SitemapUrl,
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
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    SocialLoginSerializer,
    UserProfileSerializer,
    AIWebsiteGenerationSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # Create profile automatically
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)

        # Generate JWT tokens for auto-login
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "Registration successful",
            },
            status=status.HTTP_201_CREATED,
        )

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

        if not username or not password:
            return Response(
                {"error": "Please provide both username and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
        from core.plan_checker import check_website_limit, check_custom_domain

        # Check website limit based on plan
        limit_check = check_website_limit(self.request.user)
        if not limit_check["allowed"]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(limit_check["message"])

        # Check if custom_domain is being set and user's plan allows it
        custom_domain = serializer.validated_data.get("custom_domain")
        if custom_domain:
            if not check_custom_domain(self.request.user):
                raise PermissionDenied(
                    "Custom domains are only available on paid plans. Please upgrade your plan."
                )

        website = serializer.save(owner=self.request.user)
        page_elements = self.request.data.get("page_elements", [])
        self._save_page_elements(website, page_elements)

    def perform_update(self, serializer):
        from core.plan_checker import check_custom_domain
         
        # Check if custom_domain is being set/updated and user's plan allows it
        custom_domain = serializer.validated_data.get("custom_domain")
        if custom_domain:
            current_domain = serializer.instance.custom_domain if serializer.instance else None
            # If domain is being added or changed
            if current_domain != custom_domain:
                if not check_custom_domain(self.request.user):
                    raise PermissionDenied(
                        "Custom domains are only available on paid plans. Please upgrade your plan."
                    )
        
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

    @action(detail=True, methods=['post'])
    def check_domain_availability(self, request, pk=None):
        """Check if a domain or subdomain is available for use"""
        website = self.get_object()
        domain_type = request.data.get('type')  # 'custom' or 'subdomain'
        value = request.data.get('value')
        
        if not domain_type or not value:
            return Response(
                {'error': 'Domain type and value are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if domain_type == 'custom':
            # Check custom domain availability
            if Domain.objects.filter(domain=value).exists():
                return Response({'available': False, 'message': 'Domain already taken'})
            
            # Check if user can use custom domains
            if not check_custom_domain(request.user):
                return Response(
                    {'error': 'Custom domains are only available on paid plans. Please upgrade your plan.'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            return Response({'available': True, 'message': 'Domain is available'})
            
        elif domain_type == 'subdomain':
            # Check subdomain availability
            if Website.objects.filter(subdomain=value).exists():
                return Response({'available': False, 'message': 'Subdomain already taken'})
            
            # Basic subdomain validation
            import re
            if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$', value) or len(value) < 3:
                return Response({'available': False, 'message': 'Invalid subdomain format'})
                
            return Response({'available': True, 'message': 'Subdomain is available'})
        
        return Response(
            {'error': 'Invalid domain type. Use "custom" or "subdomain"'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def publish_with_domain(self, request, pk=None):
        """Publish website with custom domain or subdomain"""
        website = self.get_object()
        domain_type = request.data.get('domain_type')  # 'custom' or 'subdomain'
        domain_value = request.data.get('domain_value')
        
        if not domain_type or not domain_value:
            return Response(
                {'error': 'Domain type and value are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate domain availability first
        if domain_type == 'custom':
            if Domain.objects.filter(domain=domain_value).exists():
                return Response(
                    {'error': 'Domain already taken'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user can use custom domains
            if not check_custom_domain(request.user):
                return Response(
                    {'error': 'Custom domains are only available on paid plans. Please upgrade your plan.'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Update website with custom domain
            website.custom_domain = domain_value
            website.subdomain = None
            
        elif domain_type == 'subdomain':
            if Website.objects.filter(subdomain=domain_value).exists():
                return Response(
                    {'error': 'Subdomain already taken'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Basic subdomain validation
            import re
            if not re.match(r'^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$', domain_value) or len(domain_value) < 3:
                return Response(
                    {'error': 'Invalid subdomain format'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Update website with subdomain
            website.subdomain = domain_value
            website.custom_domain = None
        
        # Publish the website
        website.status = 'published'
        website.is_published = True
        website.published_at = timezone.now()
        website.save()
        
        # Return success with domain info
        full_domain = domain_value if domain_type == 'custom' else f"{domain_value}.websitebuilder.com"
        return Response({
            'message': f'Website published successfully at https://{full_domain}',
            'domain': full_domain,
            'ssl_enabled': True  # SSL is automatically provisioned
        })


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

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Free templates are accessible to all
        if not instance.is_free:
            # Authenticated users with proper plan can access
            if request.user.is_authenticated:
                from core.plan_checker import check_template_access
                allowed, reason = check_template_access(request.user, instance)
                if not allowed:
                    return Response(
                        {"error": reason or "Your plan does not allow accessing this template. Upgrade to view full details."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                # Non-authenticated users cannot see full details of premium templates
                return Response(
                    {"error": "Authentication required to view template details"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class UserTemplateViewSet(viewsets.ModelViewSet):
    """Manage user's purchased templates"""

    serializer_class = UserTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserTemplate.objects.filter(user=self.request.user)

    def create(self, request):
        """Create a copy of a template for the user (purchase/claim)"""
        from core.plan_checker import check_template_access
        
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

        # Check template access based on user's billing plan
        if not template.is_free:
            allowed, reason = check_template_access(request.user, template)
            if not allowed:
                return Response(
                    {"error": reason or "Your plan does not allow accessing this template. Please upgrade your plan."},
                    status=status.HTTP_403_FORBIDDEN,
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
        from core.plan_checker import check_template_access
        
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

        # Check template access based on user's billing plan (for paid templates)
        if not template.is_free:
            allowed, reason = check_template_access(request.user, template)
            if not allowed:
                return Response(
                    {"error": reason or "Your plan does not allow purchasing this template. Please upgrade your plan."},
                    status=status.HTTP_403_FORBIDDEN,
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

        # Build canonical URL
        request_scheme = request.scheme
        request_host = request.get_host()
        canonical_url = (
            website.custom_domain
            or f"{request_host}"
            or ""
        )
        if canonical_url:
            canonical_url = f"{request_scheme}://{canonical_url.rstrip('/')}/website/{website.slug}/"

        # Open Graph fields from SeoSettings if available
        og_title = website.seo_title or website.name
        og_description = website.seo_description
        og_image = None
        try:
            seo = website.seo_settings
            if seo.default_og_image:
                og_image = seo.default_og_image
        except SeoSettings.DoesNotExist:
            pass

        # Check if owner has white label/remove branding feature
        from core.plan_checker import check_branding_removal
        show_branding = not check_branding_removal(website.owner)

        return Response(
            {
                "id": website.id,
                "name": website.name,
                "slug": website.slug,
                "subdomain": website.subdomain,
                "custom_domain": website.custom_domain,
                "seo_title": website.seo_title,
                "seo_description": website.seo_description,
                "canonical_url": canonical_url,
                "og_title": og_title,
                "og_description": og_description,
                "og_image": og_image,
                "page_elements": list(
                    page_elements.values(
                        "id", "page_name", "element_type", "element_data", "position"
                    )
                ),
                "show_branding": show_branding,
            }
        )


# ============================================
# SEO — SITEMAP & ROBOTS.TXT
# ============================================


class SitemapView(APIView):
    """Generate /sitemap.xml for all published websites."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        request_scheme = request.scheme
        request_host = request.get_host()

        root = ET.Element("urlset")
        root.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

        for website in Website.objects.filter(is_published=True):
            # Build base URL: prefer custom domain, then host header, then fallback
            base = (
                website.custom_domain
                or f"{request_host}"
                or ""
            )
            base_url = f"{request_scheme}://{base.rstrip('/')}/" if base else None
            if not base_url:
                continue

            def add_url(loc, **kwargs):
                url_el = ET.SubElement(root, "url")
                loc_el = ET.SubElement(url_el, "loc")
                loc_el.text = loc
                for key, value in kwargs.items():
                    if value:
                        child = ET.SubElement(url_el, key)
                        child.text = str(value)

            # Homepage
            homepage_url = f"{base_url}website/{website.slug}/"
            add_url(homepage_url, lastmod=website.updated_at.isoformat(), changefreq="weekly", priority="1.0")

            # Page model entries
            seen = {homepage_url}
            for page in Page.objects.filter(website=website, is_published=True):
                if page.is_homepage:
                    pg_url = homepage_url
                else:
                    pg_url = f"{base_url}website/{website.slug}/{page.slug}/"
                if pg_url not in seen:
                    seen.add(pg_url)
                    add_url(pg_url, lastmod=(page.updated_at or website.updated_at).isoformat(), priority="0.85")

            # PageElement page_name entries
            for page_name in PageElement.objects.filter(website=website, is_visible=True) \
                    .values_list("page_name", flat=True).distinct():
                if page_name == "index":
                    continue
                pe_url = f"{base_url}website/{website.slug}/{page_name}/"
                if pe_url not in seen:
                    seen.add(pe_url)
                    add_url(pe_url, priority="0.9")

            # Blog posts
            for post in BlogPost.objects.filter(website=website, status="published").only("slug", "updated_at"):
                post_url = f"{base_url}blog/{post.slug}/"
                if post_url not in seen:
                    seen.add(post_url)
                    add_url(post_url, lastmod=post.updated_at.isoformat(), priority="0.8")

            # Products
            for prod in Product.objects.filter(website=website, is_active=True).only("slug", "updated_at"):
                prod_url = f"{base_url}store/{website.slug}/products/{prod.slug}/"
                if prod_url not in seen:
                    seen.add(prod_url)
                    add_url(prod_url, lastmod=prod.updated_at.isoformat(), priority="0.8")

        xml_bytes = BytesIO()
        ET.ElementTree(root).write(xml_bytes, encoding="unicode", xml_declaration=True)
        return Response(xml_bytes.getvalue(), content_type="application/xml")


class RobotsTxtView(APIView):
    """Serve /robots.txt — default content, or per-website SeoSettings if a website is identified."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Support ?website_id=<id> to serve a specific website's robots.txt
        website_id = request.query_params.get("website_id")
        content = (
            "User-agent: *\n"
            "Allow: /\n"
            "Disallow: /admin/\n"
            "Sitemap: /sitemap.xml\n"
        )

        if website_id:
            try:
                website = Website.objects.get(id=website_id, is_published=True)
                try:
                    seo = website.seo_settings
                    custom = seo.robots_txt.strip()
                    if custom:
                        content = custom
                except SeoSettings.DoesNotExist:
                    pass
            except Website.DoesNotExist:
                pass

        return Response(content, content_type="text/plain; charset=utf-8")


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

        # Verify reCAPTCHA if configured
        recaptcha_response = request.data.get('recaptcha_token')
        recaptcha_secret = getattr(settings, 'RECAPTCHA_SECRET_KEY', '')

        if recaptcha_secret:
            if not recaptcha_response:
                return Response(
                    {'error': 'reCAPTCHA verification required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            import requests
            verify_url = 'https://www.google.com/recaptcha/api/siteverify'

            try:
                response = requests.post(
                    verify_url,
                    data={
                        'secret': recaptcha_secret,
                        'response': recaptcha_response
                    },
                    timeout=5
                )
                result = response.json()

                if not result.get('success', False):
                    return Response(
                        {'error': 'reCAPTCHA verification failed'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                score = result.get('score', 0)
                threshold = getattr(settings, 'RECAPTCHA_SCORE_THRESHOLD', 0.5)

                if score < threshold:
                    return Response(
                        {'error': 'reCAPTCHA score too low'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                print(f"reCAPTCHA verification error: {e}")
                if not settings.DEBUG:
                    return Response(
                        {'error': 'reCAPTCHA verification unavailable'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        else:
            if not recaptcha_response and not settings.DEBUG:
                return Response(
                    {'error': 'reCAPTCHA not configured in production'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
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

        # Verify reCAPTCHA if configured
        recaptcha_response = request.data.get('recaptcha_token')
        recaptcha_secret = getattr(settings, 'RECAPTCHA_SECRET_KEY', '')

        if recaptcha_secret:
            if not recaptcha_response:
                return Response(
                    {'error': 'reCAPTCHA verification required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            import requests
            verify_url = 'https://www.google.com/recaptcha/api/siteverify'

            try:
                response = requests.post(
                    verify_url,
                    data={
                        'secret': recaptcha_secret,
                        'response': recaptcha_response
                    },
                    timeout=5
                )
                result = response.json()

                if not result.get('success', False):
                    return Response(
                        {'error': 'reCAPTCHA verification failed'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                score = result.get('score', 0)
                threshold = getattr(settings, 'RECAPTCHA_SCORE_THRESHOLD', 0.5)

                if score < threshold:
                    return Response(
                        {'error': 'reCAPTCHA score too low'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                print(f"reCAPTCHA verification error: {e}")
                if not settings.DEBUG:
                    return Response(
                        {'error': 'reCAPTCHA verification unavailable'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        else:
            if not recaptcha_response and not settings.DEBUG:
                return Response(
                    {'error': 'reCAPTCHA not configured in production'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
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


# ============================================
# AI WEBSITE GENERATION VIEWS
# ============================================


class AIWebsiteGenerateView(APIView):
    """Generate a website from an AI prompt"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .serializers import AIWebsiteGenerateSerializer, AIWebsiteGenerationSerializer
        from .models import AIWebsiteGeneration

        serializer = AIWebsiteGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        prompt = serializer.validated_data["prompt"]

        # Create AI generation record
        ai_gen = AIWebsiteGeneration.objects.create(
            user=request.user,
            prompt=prompt,
            status="processing",
        )

        try:
            # Generate website structure based on prompt analysis
            elements = self.parse_prompt_to_elements(prompt)

            ai_gen.generated_content = {"elements": elements}
            ai_gen.status = "completed"
            ai_gen.completed_at = timezone.now()
            ai_gen.save()

            return Response(
                AIWebsiteGenerationSerializer(ai_gen).data,
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            ai_gen.status = "failed"
            ai_gen.error_message = str(e)
            ai_gen.save()
            return Response(
                {"error": f"AI generation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def parse_prompt_to_elements(self, prompt):
        """Convert a text prompt into website builder elements"""
        prompt_lower = prompt.lower()
        elements = []

        # Detect business type and industry
        industry = "general"
        if any(word in prompt_lower for word in ["restaurant", "cafe", "food", "eatery"]):
            industry = "restaurant"
        elif any(word in prompt_lower for word in ["portfolio", "photography", "designer", "artist"]):
            industry = "portfolio"
        elif any(word in prompt_lower for word in ["ecommerce", "shop", "store", "sell"]):
            industry = "ecommerce"
        elif any(word in prompt_lower for word in ["blog", "news", "articles", "writing"]):
            industry = "blog"
        elif any(word in prompt_lower for word in ["agency", "consulting", "services"]):
            industry = "business"

        # Build elements based on detected industry
        if industry == "restaurant":
            elements = [
                {"id": "1", "type": "nav", "data": {"logo": "Restaurant", "links": [{"text": "Home", "url": "#"}, {"text": "Menu", "url": "#menu"}, {"text": "About", "url": "#about"}, {"text": "Contact", "url": "#contact"}]}},
                {"id": "2", "type": "hero", "data": {"title": "Welcome to Our Restaurant", "subtitle": "Delicious food made with love", "ctaText": "View Menu", "ctaUrl": "#menu", "bgColor": "#e74c3c"}},
                {"id": "3", "type": "features", "data": {"title": "Why Choose Us", "subtitle": "Quality you can taste", "features": [{"icon": "🍽️", "title": "Fresh Ingredients", "description": "Locally sourced, always fresh"}, {"icon": "👨‍🍳", "title": "Expert Chefs", "description": "Years of culinary experience"}, {"icon": "🚚", "title": "Fast Delivery", "description": "Hot food delivered to your door"}]}},
                {"id": "4", "type": "about", "data": {"title": "About Our Restaurant", "content": "We have been serving the community with delicious meals made from the freshest ingredients. Come visit us for an unforgettable dining experience.", "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600"}},
                {"id": "5", "type": "contact", "data": {"title": "Contact Us", "subtitle": "Make a reservation", "email": "info@restaurant.com", "phone": "(555) 123-4567", "address": "123 Main Street"}},
                {"id": "6", "type": "footer", "data": {"company": "Restaurant Name", "links": [{"text": "Privacy", "url": "#"}, {"text": "Terms", "url": "#"}], "social": ["facebook", "instagram"]}},
            ]
        elif industry == "portfolio":
            elements = [
                {"id": "1", "type": "nav", "data": {"logo": "Portfolio", "links": [{"text": "Home", "url": "#"}, {"text": "Work", "url": "#work"}, {"text": "About", "url": "#about"}, {"text": "Contact", "url": "#contact"}]}},
                {"id": "2", "type": "hero", "data": {"title": "Creative Designer", "subtitle": "Building beautiful digital experiences", "ctaText": "View Work", "ctaUrl": "#work", "bgColor": "#667eea"}},
                {"id": "3", "type": "gallery", "data": {"title": "My Work", "images": [{"src": "https://images.unsplash.com/photo-1558655146-d09347e92466?w=400", "alt": "Project 1"}, {"src": "https://images.unsplash.com/photo-1542744095-fcf47d892719?w=400", "alt": "Project 2"}, {"src": "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400", "alt": "Project 3"}]}},
                {"id": "4", "type": "about", "data": {"title": "About Me", "content": "I am a passionate designer and developer with years of experience creating digital products that people love.", "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"}},
                {"id": "5", "type": "contact", "data": {"title": "Get in Touch", "email": "hello@example.com", "phone": "(555) 123-4567"}},
                {"id": "6", "type": "footer", "data": {"company": "Your Name", "links": [{"text": "Privacy", "url": "#"}], "social": ["twitter", "linkedin"]}},
            ]
        elif industry == "ecommerce":
            elements = [
                {"id": "1", "type": "nav", "data": {"logo": "Store", "links": [{"text": "Home", "url": "#"}, {"text": "Products", "url": "#products"}, {"text": "Cart", "url": "#"}, {"text": "Account", "url": "#"}]}},
                {"id": "2", "type": "hero", "data": {"title": "Welcome to Our Store", "subtitle": "Quality products at great prices", "ctaText": "Shop Now", "ctaUrl": "#products", "bgColor": "#2ecc71"}},
                {"id": "3", "type": "products", "data": {"title": "Featured Products", "products": [{"name": "Product 1", "price": "$29.99", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"}, {"name": "Product 2", "price": "$49.99", "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}, {"name": "Product 3", "price": "$19.99", "image": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200"}]}},
                {"id": "4", "type": "testimonials", "data": {"title": "Customer Reviews", "testimonials": [{"name": "John D.", "text": "Great products and fast shipping!", "avatar": "JD"}, {"name": "Sarah M.", "text": "Love my purchase, highly recommend!", "avatar": "SM"}]}},
                {"id": "5", "type": "footer", "data": {"company": "Your Store", "links": [{"text": "Shipping", "url": "#"}, {"text": "Returns", "url": "#"}], "social": ["facebook", "twitter", "instagram"]}},
            ]
        else:  # general/business
            elements = [
                {"id": "1", "type": "nav", "data": {"logo": "Company", "links": [{"text": "Home", "url": "#"}, {"text": "Services", "url": "#services"}, {"text": "About", "url": "#about"}, {"text": "Contact", "url": "#contact"}]}},
                {"id": "2", "type": "hero", "data": {"title": "Welcome to Our Business", "subtitle": "Professional services you can trust", "ctaText": "Learn More", "ctaUrl": "#services", "bgColor": "#3498db"}},
                {"id": "3", "type": "services", "data": {"title": "Our Services", "subtitle": "What we offer", "services": [{"icon": "💼", "title": "Consulting", "description": "Expert business consulting"}, {"icon": "💻", "title": "Development", "description": "Custom software solutions"}, {"icon": "📈", "title": "Marketing", "description": "Digital marketing strategies"}]}},
                {"id": "4", "type": "about", "data": {"title": "About Us", "content": "We are a professional team dedicated to providing exceptional service and results for our clients.", "image": "https://images.unsplash.com/photo-1521737604893-d1f59b0e1e8e?w=400"}},
                {"id": "5", "type": "contact", "data": {"title": "Contact Us", "subtitle": "Get in touch today", "email": "info@company.com", "phone": "(555) 123-4567", "address": "123 Business Ave, City"}},
                {"id": "6", "type": "footer", "data": {"company": "Your Company", "links": [{"text": "Privacy", "url": "#"}, {"text": "Terms", "url": "#"}], "social": ["linkedin", "twitter"]}},
            ]

        return elements


class AIWebsiteGenerationListView(generics.ListAPIView):
    """List user's AI generations"""

    serializer_class = AIWebsiteGenerationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AIWebsiteGeneration.objects.filter(user=self.request.user)


class ApplyAIGeneratedWebsiteView(APIView):
    """Apply an AI-generated website structure to a new website"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, generation_id):
        from .models import AIWebsiteGeneration, Website
        from .serializers import AIWebsiteGenerationSerializer

        try:
            ai_gen = AIWebsiteGeneration.objects.get(id=generation_id, user=request.user)
        except AIWebsiteGeneration.DoesNotExist:
            return Response(
                {"error": "AI generation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ai_gen.status != "completed":
            return Response(
                {"error": "AI generation not completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        website_name = request.data.get("name", "My AI Generated Website")

        website = Website.objects.create(
            owner=request.user,
            name=website_name,
            content=str(ai_gen.generated_content),
        )

        elements_data = ai_gen.generated_content.get("elements", [])
        for elem in elements_data:
            PageElement.objects.create(
                website=website,
                page_name="index",
                element_type=elem["type"],
                element_data=elem["data"],
                position=int(elem["id"]),
            )

        ai_gen.website = website
        ai_gen.save()

        return Response(
            {"website_id": website.id, "message": "Website created successfully"},
            status=status.HTTP_201_CREATED,
        )


# ============================================
# FORM SUBMISSION VIEWS
# ============================================


class FormSubmissionView(APIView):
    """Public endpoint for submitting forms from published websites"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .models import Form, FormSubmission, Website
        from .serializers import FormSubmissionSerializer

        website_id = request.data.get("website_id")
        form_slug = request.data.get("form_slug")
        submission_data = request.data.get("data", {})

        if not website_id or not form_slug:
            return Response(
                {"error": "website_id and form_slug are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            website = Website.objects.get(id=website_id, is_published=True)
            form = Form.objects.get(website=website, slug=form_slug, is_active=True)
        except Website.DoesNotExist:
            return Response(
                {"error": "Website not found or not published"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Form.DoesNotExist:
            return Response(
                {"error": "Form not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        ip_address = request.META.get("REMOTE_ADDR")
        submission = FormSubmission.objects.create(
            website=website,
            form_name=form.name,
            submission_data=submission_data,
            ip_address=ip_address,
        )

        if form.email_notifications:
            self._send_notification_email(form, submission_data, website)

        return Response(
            {
                "success": True,
                "message": form.success_message or "Thank you for your submission!",
                "submission_id": submission.id,
            },
            status=status.HTTP_201_CREATED,
        )

    def _send_notification_email(self, form, submission_data, website):
        from django.core.mail import EmailMessage
        from django.conf import settings

        emails = form.email_notifications if isinstance(form.email_notifications, list) else [form.email_notifications]
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@websitebuilder.com")

        subject = f"New form submission: {form.name}"
        body = f"New submission on {website.name}:\n\n"
        for key, value in submission_data.items():
            body += f"{key}: {value}\n"

        for email in emails:
            try:
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=from_email,
                    recipient_list=[email],
                    fail_silently=True,
                )
            except Exception:
                pass


class AdminBillingStatsView(APIView):
    """Admin dashboard billing statistics"""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Sum, Count, Q
        from .models import Payment, Invoice, Subscription, UserBillingPlan

        now = timezone.now()
        month_start = now.replace(day=1)

        # Total Revenue
        total_revenue = Payment.objects.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or 0

        # Monthly Revenue
        monthly_revenue = Payment.objects.filter(
            status='completed',
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Active Subscriptions
        active_subscriptions = UserBillingPlan.objects.filter(
            plan__isnull=False,
            plan__price__gt=0
        ).count()

        # Cancelled Subscriptions (users with no plan or free plan after having paid)
        cancelled_subscriptions = Subscription.objects.filter(
            status='cancelled'
        ).count()

        # Pending Payments
        pending_payments = Payment.objects.filter(
            status='pending'
        ).count()

        # Recent Transactions
        recent_transactions = Payment.objects.select_related('user').filter(
            status__in=['completed', 'failed', 'pending']
        ).order_by('-created_at')[:10].values(
            'id', 'amount', 'currency', 'status', 'created_at',
            'user__username', 'user__email'
        )

        return Response({
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'active_subscriptions': active_subscriptions,
            'cancelled_subscriptions': cancelled_subscriptions,
            'pending_payments': pending_payments,
            'recent_transactions': list(recent_transactions),
        })

