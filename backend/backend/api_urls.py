from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .stripe_views import StripeCheckoutSessionView
from .payments_views import (
    StripeConfigView,
    CreatePaymentIntentView,
    ConfirmPaymentView,
    MobileMoneyPaymentView,
    VerifyMobilePaymentView,
    InvoiceListView,
    InvoiceDetailView,
    SubscriptionDetailView,
    CancelSubscriptionView,
    StripeWebhookView,
)
from core.views import (
    RegisterView,
    UserProfileView,
    WebsiteViewSet,
    BillingPlanListView,
    UserBillingPlanView,
    UserPlanInfoView,
    SelectBillingPlanView,
    CheckPlanSelectionView,
    TemplateListView,
    TemplateDetailView,
    UserTemplateViewSet,
    TemplatePurchaseView,
    TemplateOrderViewSet,
    VerifyEmailView,
    ResendVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    SocialLoginView,
    WebsiteTeamView,
    WebsiteTeamMemberView,
    PublicWebsiteView,
    LoginView,
    LoginHistoryView,
    UserSessionsView,
    RevokeSessionView,
    TwoFactorSetupView,
    TwoFactorVerifyView,
    TwoFactorDisableView,
    MagicLoginRequestView,
    MagicLoginVerifyView,
    MediaImageListCreateView,
    MediaImageDetailView,
)
from core.custom_upload_views import (
    CustomWebsiteUploadViewSet,
    WebsiteTemplateJSONViewSet,
)

router = DefaultRouter()
router.register(r"websites", WebsiteViewSet, basename="website")
router.register(r"user-templates", UserTemplateViewSet, basename="user-template")
router.register(r"template-orders", TemplateOrderViewSet, basename="template-order")
router.register(r"custom-uploads", CustomWebsiteUploadViewSet, basename="custom-upload")
router.register(r"template-json", WebsiteTemplateJSONViewSet, basename="template-json")

urlpatterns = [
    # Authentication
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterView.as_view(), name="register"),
    path("user-profile/", UserProfileView.as_view(), name="user_profile"),
    path("my-plan/", UserPlanInfoView.as_view(), name="my_plan"),
    # Login History & Sessions
    path("login-history/", LoginHistoryView.as_view(), name="login_history"),
    path("sessions/", UserSessionsView.as_view(), name="user_sessions"),
    path(
        "sessions/<int:session_id>/revoke/",
        RevokeSessionView.as_view(),
        name="revoke_session",
    ),
    # 2FA
    path("2fa/setup/", TwoFactorSetupView.as_view(), name="2fa_setup"),
    path("2fa/verify/", TwoFactorVerifyView.as_view(), name="2fa_verify"),
    path("2fa/disable/", TwoFactorDisableView.as_view(), name="2fa_disable"),
    # Magic Link Login
    path("magic-login/", MagicLoginRequestView.as_view(), name="magic_login_request"),
    path(
        "magic-login/verify/", MagicLoginVerifyView.as_view(), name="magic_login_verify"
    ),
    # Email Verification
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path(
        "resend-verification/",
        ResendVerificationView.as_view(),
        name="resend_verification",
    ),
    # Password Reset
    path(
        "password-reset/",
        PasswordResetRequestView.as_view(),
        name="password_reset_request",
    ),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    # Social Login
    path("social-login/", SocialLoginView.as_view(), name="social_login"),
    # Websites
    path("", include(router.urls)),
    # Billing Plans
    path("billing-plans/", BillingPlanListView.as_view(), name="billing_plans"),
    path(
        "billing/select/", SelectBillingPlanView.as_view(), name="select_billing_plan"
    ),
    path(
        "billing/check/", CheckPlanSelectionView.as_view(), name="check_plan_selection"
    ),
    path("billing/", UserBillingPlanView.as_view(), name="user_billing_plan"),
    # Templates
    path("templates/", TemplateListView.as_view(), name="templates"),
    path(
        "templates/<slug:slug>/", TemplateDetailView.as_view(), name="template_detail"
    ),
    path(
        "templates/purchase/", TemplatePurchaseView.as_view(), name="template_purchase"
    ),
    # Legacy Stripe Checkout (kept for backward compatibility)
    path(
        "stripe/create-checkout-session/",
        StripeCheckoutSessionView.as_view(),
        name="stripe_checkout_session",
    ),
    # New Payment System
    path("stripe/config/", StripeConfigView.as_view(), name="stripe_config"),
    path(
        "payments/create-intent/",
        CreatePaymentIntentView.as_view(),
        name="create_payment_intent",
    ),
    path("payments/confirm/", ConfirmPaymentView.as_view(), name="confirm_payment"),
    path(
        "payments/mobile-money/",
        MobileMoneyPaymentView.as_view(),
        name="mobile_money_payment",
    ),
    path(
        "payments/mobile-verify/",
        VerifyMobilePaymentView.as_view(),
        name="verify_mobile_payment",
    ),
    # Invoicing
    path("invoices/", InvoiceListView.as_view(), name="invoice_list"),
    path(
        "invoices/<uuid:invoice_id>/",
        InvoiceDetailView.as_view(),
        name="invoice_detail",
    ),
    # Subscription
    path("subscription/", SubscriptionDetailView.as_view(), name="subscription_detail"),
    path(
        "subscription/cancel/",
        CancelSubscriptionView.as_view(),
        name="cancel_subscription",
    ),
    # Webhooks
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe_webhook"),
    # Team Management
    path(
        "websites/<int:website_id>/team/",
        WebsiteTeamView.as_view(),
        name="website_team",
    ),
    path(
        "websites/<int:website_id>/team/<int:member_id>/",
        WebsiteTeamMemberView.as_view(),
        name="website_team_member",
    ),
    # Public Website View
    path("public/website/", PublicWebsiteView.as_view(), name="public_website"),
    path(
        "public/website/<int:website_id>/",
        PublicWebsiteView.as_view(),
        name="public_website_by_id",
    ),
    # Media Gallery
    path("media/images/", MediaImageListCreateView.as_view(), name="media_images"),
    path(
        "media/images/<int:image_id>/",
        MediaImageDetailView.as_view(),
        name="media_image_detail",
    ),
]
