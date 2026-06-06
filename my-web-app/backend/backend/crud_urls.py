from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.crud_views import (
    BillingPlanCRUDView,
    BillingPlanFeatureCRUDView,
    UserBillingPlanCRUDView,
    SubscriptionCRUDView,
    PaymentCRUDView,
    InvoiceCRUDView,
    InvoiceItemCRUDView,
    TemplateCRUDView,
    UserTemplateCRUDView,
    TemplatePurchaseCRUDView,
    TemplateOrderCRUDView,
    WebsiteCRUDView,
    TeamMemberCRUDView,
    DomainCRUDView,
    PageElementCRUDView,
    PageViewAnalyticsView,
    AnalyticsOverviewView,
    BlogPostCRUDView,
    CategoryCRUDView,
    TagCRUDView,
    # Forms & Contact
    FormCRUDView,
    FormFieldCRUDView,
    FormSubmissionCRUDView,
    NewsletterSubscriberCRUDView,
    EmailCampaignCRUDView,
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
    # SEO
    SeoSettingsCRUDView,
    SitemapUrlCRUDView,
)


router = DefaultRouter()

# Register all CRUD views
router.register(r"billing/plans", BillingPlanCRUDView, basename="billing-plan")
router.register(r"user-billing", UserBillingPlanCRUDView, basename="user-billing")
router.register(r"subscriptions", SubscriptionCRUDView, basename="subscription")
router.register(r"payments", PaymentCRUDView, basename="payment")
router.register(r"invoices", InvoiceCRUDView, basename="invoice")
router.register(r"invoice-items", InvoiceItemCRUDView, basename="invoice-item")
router.register(r"templates/crud", TemplateCRUDView, basename="template-crud")
router.register(
    r"user-templates/crud", UserTemplateCRUDView, basename="user-template-crud"
)
router.register(
    r"template-purchases", TemplatePurchaseCRUDView, basename="template-purchase"
)
router.register(
    r"template-orders/crud", TemplateOrderCRUDView, basename="template-order-crud"
)
router.register(r"websites/crud", WebsiteCRUDView, basename="website-crud")
router.register(r"team-members", TeamMemberCRUDView, basename="team-member")
router.register(r"domains", DomainCRUDView, basename="domain")
router.register(r"page-elements", PageElementCRUDView, basename="page-element")
router.register(r"analytics", PageViewAnalyticsView, basename="analytics")
router.register(r"blog-posts", BlogPostCRUDView, basename="blog-post-crud")
router.register(r"categories", CategoryCRUDView, basename="category-crud")
router.register(r"tags", TagCRUDView, basename="tag-crud")
# Forms & Contact
router.register(r"forms", FormCRUDView, basename="form")
router.register(r"form-fields", FormFieldCRUDView, basename="form-field")
router.register(r"form-submissions", FormSubmissionCRUDView, basename="form-submission")
router.register(r"newsletter-subscribers", NewsletterSubscriberCRUDView, basename="newsletter-subscriber")
router.register(r"email-campaigns", EmailCampaignCRUDView, basename="email-campaign")
# E-commerce
router.register(r"product-categories", ProductCategoryCRUDView, basename="product-category")
router.register(r"products", ProductCRUDView, basename="product")
router.register(r"product-options", ProductOptionCRUDView, basename="product-option")
router.register(r"product-variants", ProductVariantCRUDView, basename="product-variant")
router.register(r"carts", CartCRUDView, basename="cart")
router.register(r"cart-items", CartItemCRUDView, basename="cart-item")
router.register(r"orders", OrderCRUDView, basename="order")
router.register(r"order-items", OrderItemCRUDView, basename="order-item")
router.register(r"coupons", CouponCRUDView, basename="coupon")
router.register(r"product-reviews", ProductReviewCRUDView, basename="product-review")
router.register(r"wishlists", WishlistCRUDView, basename="wishlist")
# SEO
router.register(r"seo-settings", SeoSettingsCRUDView, basename="seo-settings")
router.register(r"sitemap-urls", SitemapUrlCRUDView, basename="sitemap-url")

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
    # Additional custom endpoints
    path(
        "billing/plans/<int:plan_id>/features/",
        BillingPlanFeatureCRUDView.as_view({"get": "list", "post": "create"}),
        name="billing-plan-features",
    ),
    path(
    
        "invoices/generate-number/",
        InvoiceCRUDView.as_view({"get": "generate_number"}),
        name="invoice-generate-number",
    ),
    path(
        "analytics/pageviews/<int:website_id>/daily/",
        PageViewAnalyticsView.as_view({"get": "daily"}),
        name="pageview-daily",
    ),
    path(
        "analytics/pageviews/<int:website_id>/total/",
        PageViewAnalyticsView.as_view({"get": "total"}),
        name="pageview-total",
    ),
    path(
        "analytics/pageviews/<int:website_id>/referrers/",
        PageViewAnalyticsView.as_view({"get": "referrers"}),
        name="pageview-referrers",
    ),
    path(
        "analytics/pageviews/<int:website_id>/devices/",
        PageViewAnalyticsView.as_view({"get": "devices"}),
        name="pageview-devices",
    ),
    path(
        "analytics/overview/",
        AnalyticsOverviewView.as_view({"get": "get"}),
        name="analytics-overview",
    ),
]

