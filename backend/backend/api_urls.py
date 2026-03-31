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
    RegisterView, WebsiteViewSet,
    BillingPlanListView, UserBillingPlanView, SelectBillingPlanView, CheckPlanSelectionView,
    TemplateListView, TemplateDetailView, UserTemplateViewSet,
    TemplatePurchaseView, TemplateOrderViewSet
)

router = DefaultRouter()
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'user-templates', UserTemplateViewSet, basename='user-template')
router.register(r'template-orders', TemplateOrderViewSet, basename='template-order')

urlpatterns = [
    # Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    
    # Websites
    path('', include(router.urls)),
    
    # Billing Plans
    path('billing-plans/', BillingPlanListView.as_view(), name='billing_plans'),
    path('billing/select/', SelectBillingPlanView.as_view(), name='select_billing_plan'),
    path('billing/check/', CheckPlanSelectionView.as_view(), name='check_plan_selection'),
    path('billing/', UserBillingPlanView.as_view(), name='user_billing_plan'),
    
    # Templates
    path('templates/', TemplateListView.as_view(), name='templates'),
    path('templates/<slug:slug>/', TemplateDetailView.as_view(), name='template_detail'),
    path('templates/purchase/', TemplatePurchaseView.as_view(), name='template_purchase'),
    
    # Legacy Stripe Checkout (kept for backward compatibility)
    path('stripe/create-checkout-session/', StripeCheckoutSessionView.as_view(), name='stripe_checkout_session'),
    
    # New Payment System
    path('stripe/config/', StripeConfigView.as_view(), name='stripe_config'),
    path('payments/create-intent/', CreatePaymentIntentView.as_view(), name='create_payment_intent'),
    path('payments/confirm/', ConfirmPaymentView.as_view(), name='confirm_payment'),
    path('payments/mobile-money/', MobileMoneyPaymentView.as_view(), name='mobile_money_payment'),
    path('payments/mobile-verify/', VerifyMobilePaymentView.as_view(), name='verify_mobile_payment'),
    
    # Invoicing
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
    path('invoices/<uuid:invoice_id>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    
    # Subscription
    path('subscription/', SubscriptionDetailView.as_view(), name='subscription_detail'),
    path('subscription/cancel/', CancelSubscriptionView.as_view(), name='cancel_subscription'),
    
    # Webhooks
    path('webhooks/stripe/', StripeWebhookView.as_view(), name='stripe_webhook'),
]
