from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

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
    PaymentHistoryView,
)
from core.flutterwave_views import (
    FlutterwaveConfigView,
    InitializeFlutterwavePaymentView,
    VerifyFlutterwavePaymentView,
    FlutterwaveWebhookView,
    PaymentMethodListCreateView,
    PaymentMethodDetailView,
)
from core.crud_views import (
    ExportedWebsiteCRUDView,
    AnalyticsOverviewView,
    # E-commerce
    ProductCategoryCRUDView,
    ProductCRUDView,
    ProductOptionCRUDView,
    ProductVariantCRUDView,
    CartCRUDView,
    CartItemCRUDView,
    OrderCRUDView,
    OrderItemCRUDView,
    CouponCRUDView,
    ProductReviewCRUDView,
    WishlistCRUDView,
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
     AIWebsiteGenerateView,
     AIWebsiteGenerationListView,
     ApplyAIGeneratedWebsiteView,
     FormSubmissionView,
     AdminBillingStatsView,
  )
from core.ecommerce_views import (
     PublicProductCategoryListView,
     PublicProductListView,
     PublicProductDetailView,
     CartView,
     CartItemView,
     CartClearView,
     CouponValidateView,
     CheckoutView,
     OrderListView,
     OrderDetailView,
     OrderTrackingView,
     WishlistView,
     ProductReviewView,
     PublicStorefrontView,
     StoreProductsView,
 )
from core.custom_upload_views import (
    CustomWebsiteUploadViewSet,
    WebsiteTemplateJSONViewSet,
)

router = DefaultRouter()
router.register(r"websites", WebsiteViewSet, basename="website")

# ============================================
# API Docs (OpenAPI / Swagger UI)
# Mounted by backend.urls at /api/
# So /api/docs/ and /api/schema/
# ============================================


router.register(r"user-templates", UserTemplateViewSet, basename="user-template")
router.register(r"template-orders", TemplateOrderViewSet, basename="template-order")
router.register(r"custom-uploads", CustomWebsiteUploadViewSet, basename="custom-upload")
router.register(r"template-json", WebsiteTemplateJSONViewSet, basename="template-json")

# Custom asset serving without trailing slash (for ZIP preview)
# This allows loading assets like /api/custom-uploads/1/file/style.css
custom_upload_asset_view = CustomWebsiteUploadViewSet.as_view({'get': 'serve_file_asset'})

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
        "magic-login/verify/", MagicLoginVerifyView.as_view(),
        name="magic_login_verify",
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
    # Custom ZIP asset serving (no trailing slash required) - BEFORE router include
    path(
        "custom-uploads/<int:pk>/file/<path:file_path>",
        custom_upload_asset_view,
        name="custom-upload-asset",
    ),
    # Domain availability check
    path(
        "websites/<int:website_id>/check-domain-availability/",
        WebsiteViewSet.as_view({'post': 'check_domain_availability'}),
        name="check-domain-availability",
    ),
    # Publish website with domain
    path(
        "websites/<int:website_id>/publish-with-domain/",
        WebsiteViewSet.as_view({'post': 'publish_with_domain'}),
        name="publish-with-domain",
    ),
    # Websites (router)
    path("", include(router.urls)),
    # Analytics
    path("analytics/overview/", AnalyticsOverviewView.as_view({'get': 'get'}), name="analytics-overview"),
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
        "payments/mobile-verify/",
        VerifyMobilePaymentView.as_view(),
        name="verify_mobile_payment",
    ),
    path("payments/history/", PaymentHistoryView.as_view(), name="payment_history"),
    # Flutterwave Payment System
    path(
        "flutterwave/config/",
        FlutterwaveConfigView.as_view(),
        name="flutterwave_config",
    ),
    path(
        "flutterwave/initialize/",
        InitializeFlutterwavePaymentView.as_view(),
        name="initialize_flutterwave_payment",
    ),
    path(
        "flutterwave/verify/",
        VerifyFlutterwavePaymentView.as_view(),
        name="verify_flutterwave_payment",
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
     path("webhooks/flutterwave/", FlutterwaveWebhookView.as_view(), name="flutterwave_webhook"),
     # Payment Methods
     path("payment-methods/", PaymentMethodListCreateView.as_view(), name="payment_methods"),
     path("payment-methods/<int:pk>/", PaymentMethodDetailView.as_view(), name="payment_method_detail"),
# Admin Billing Dashboard
     path(
         "admin/billing/stats/",
         AdminBillingStatsView.as_view(),
         name="admin_billing_stats",
     ),
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
# Form Submissions (public endpoint)
     path("forms/submit/", FormSubmissionView.as_view(), name="form_submit"),

    # API Docs (OpenAPI / Swagger UI)
    path("docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-docs"),
    path("schema/", SpectacularAPIView.as_view(), name="api-schema"),


     # ============================================
     # E-COMMERCE ENDPOINTS
     # ============================================
     # Public storefront
     path(
         "storefront/<int:website_id>/",
         PublicStorefrontView.as_view(),
         name="storefront",
     ),
     path(
         "storefront/<int:website_id>/products/",
         StoreProductsView.as_view(),
         name="store_products",
     ),
     # Product categories (public)
     path(
         "websites/<int:website_id>/product-categories/",
         PublicProductCategoryListView.as_view(),
         name="product_categories",
     ),
     # Products (public detail)
     path(
         "websites/<int:website_id>/products/",
         PublicProductListView.as_view(),
         name="products_list",
     ),
     path(
         "websites/<int:website_id>/products/<slug:slug>/",
         PublicProductDetailView.as_view(),
         name="product_detail",
     ),
     # Cart (authenticated)
     path(
         "websites/<int:website_id>/cart/",
         CartView.as_view(),
         name="cart",
     ),
     path(
         "websites/<int:website_id>/cart/items/",
         CartItemView.as_view(),
         name="cart_items",
     ),
     path(
         "websites/<int:website_id>/cart/clear/",
         CartClearView.as_view(),
         name="cart_clear",
     ),
     # Coupons
     path(
         "websites/<int:website_id>/coupons/validate/",
         CouponValidateView.as_view(),
         name="coupon_validate",
     ),
     # Checkout
     path(
         "websites/<int:website_id>/checkout/",
         CheckoutView.as_view(),
         name="checkout",
     ),
     # Orders (authenticated)
     path("orders/", OrderListView.as_view(), name="orders_list"),
     path("orders/<int:pk>/", OrderDetailView.as_view(), name="order_detail"),
     path("orders/track/", OrderTrackingView.as_view(), name="order_tracking"),
     # Wishlist
     path(
         "websites/<int:website_id>/wishlist/",
         WishlistView.as_view(),
         name="wishlist",
     ),
     # Product Reviews
     path(
         "products/<int:product_id>/reviews/",
         ProductReviewView.as_view(),
         name="product_reviews",
     ),
]
