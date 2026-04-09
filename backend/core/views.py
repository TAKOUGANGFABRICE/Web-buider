from rest_framework import generics, permissions, viewsets, status
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
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

        # Send verification email
        try:
            profile = user.profile
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
                    UserBillingPlan.objects.create(user=user)

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
                    UserBillingPlan.objects.create(user=user)

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


class WebsiteViewSet(viewsets.ModelViewSet):
    serializer_class = WebsiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Website.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


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
