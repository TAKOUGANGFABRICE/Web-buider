"""
Django REST Framework CRUD Views for all models
===============================================
Complete CRUD operations with filtering, searching, and analytics
"""


from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Max, Min, Avg, Sum, F, Q

from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from core.models import (
    PageView,
    Website,
    Conversion,

    BillingPlan,

    BillingPlanFeature,
    UserBillingPlan,
    Subscription,
    Website,
    TeamMember,
    Domain,
    PageElement,
    Page,
    Template,
    UserTemplate,
    TemplatePurchase,
    TemplateOrder,
    Payment,
    Invoice,
    InvoiceItem,
    # E-commerce
    ProductCategory,
    Product,
    ProductOption,
    ProductVariant,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Coupon,
    ProductReview,
    Wishlist,
    # SEO
    SeoSettings,
    SitemapUrl,
    # Code Export
    ExportedWebsite,
    # Plugins
    Plugin,
    InstalledPlugin,
    # Automation
    Webhook,
    Automation,
    # Forms
    Form,
    FormField,
    FormSubmission,
    # Newsletter
    NewsletterSubscriber,
    EmailCampaign,
    # Analytics
    PageView,
    # Backup
    WebsiteBackup,
)
from core.serializers import (
    BillingPlanSerializer,
    BillingPlanDetailSerializer,
    BillingPlanFeatureSerializer,
    UserBillingPlanSerializer,
    SubscriptionSerializer,
    WebsiteSerializer,
    TeamMemberSerializer,
    DomainSerializer,
    PageElementSerializer,
    PageSerializer,
    TemplateSerializer,
    TemplateDetailSerializer,
    UserTemplateSerializer,
    TemplatePurchaseSerializer,
    TemplateOrderSerializer,
    TemplateOrderCreateSerializer,
    PaymentSerializer,
    InvoiceSerializer,
    InvoiceItemSerializer,
    # E-commerce
    ProductCategorySerializer,
    ProductSerializer,
    ProductOptionSerializer,
    ProductVariantSerializer,
    CartItemSerializer,
    CartSerializer,
    OrderSerializer,
    OrderItemSerializer,
    CouponSerializer,
    ProductReviewSerializer,
    WishlistSerializer,
    # SEO
    SeoSettingsSerializer,
    SitemapUrlSerializer,
    # Code Export
    ExportedWebsiteSerializer,
    # Plugins
    PluginSerializer,
    InstalledPluginSerializer,
    # Automation
    WebhookSerializer,
    AutomationSerializer,
    # Forms
    FormSerializer,
    FormFieldSerializer,
    FormSubmissionSerializer,
    # Newsletter
    NewsletterSubscriberSerializer,
    EmailCampaignSerializer,
    # Analytics
    WebsiteAnalyticsSerializer,
    # Backup
    WebsiteBackupSerializer,
    # Blog/CMS
    BlogPostSerializer,
    CategorySerializer,
    TagSerializer,
)



class BaseCRUDViewset(viewsets.ModelViewSet):
    """Base viewset with common CRUD functionality"""

    def get_permissions(self):
        """Allow unauthenticated access for list operations"""
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Override to add custom filtering based on query params"""
        return super().get_queryset()


# ============================================
# BILLING PLAN VIEWS
# ============================================


class BillingPlanCRUDView(BaseCRUDViewset):
    queryset = BillingPlan.objects.all()
    serializer_class = BillingPlanSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BillingPlanDetailSerializer
        return BillingPlanSerializer

    def get_queryset(self):
        queryset = BillingPlan.objects.all()

        # Filter by active status
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        # Filter by price range
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Filter by billing period
        period = self.request.query_params.get("period")
        if period:
            queryset = queryset.filter(billing_period=period)

        # Search by name
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        return queryset.order_by("price")

    @action(detail=True, methods=["get"])
    def with_features(self, request, pk=None):
        """Get billing plan with all features"""
        plan = self.get_object()
        features = plan.features.all()
        return Response(
            {
                "plan": BillingPlanDetailSerializer(plan).data,
                "features": [
                    {
                        "name": f.feature_name,
                        "value": f.feature_value,
                        "included": f.is_included,
                    }
                    for f in features
                ],
            }
        )

    @action(detail=False, methods=["get"])
    def active_only(self, request):
        """Get only active plans"""
        plans = BillingPlan.objects.filter(is_active=True).order_by("price")
        return Response(BillingPlanSerializer(plans, many=True).data)


class BillingPlanFeatureCRUDView(BaseCRUDViewset):
    queryset = BillingPlanFeature.objects.all()

    def get_queryset(self):
        plan_id = self.kwargs.get("plan_id")
        return BillingPlanFeature.objects.filter(plan_id=plan_id)

    def create(self, request, *args, **kwargs):
        plan_id = self.kwargs.get("plan_id")
        request.data["plan_id"] = plan_id
        return super().create(request, *args, **kwargs)


# ============================================
# USER BILLING PLAN VIEWS
# ============================================


class UserBillingPlanCRUDView(BaseCRUDViewset):
    queryset = UserBillingPlan.objects.all()
    serializer_class = UserBillingPlanSerializer

    def get_queryset(self):
        queryset = UserBillingPlan.objects.select_related("user", "plan").all()

        # Filter by has_selected_plan
        has_plan = self.request.query_params.get("has_selected_plan")
        if has_plan is not None:
            queryset = queryset.filter(has_selected_plan=has_plan.lower() == "true")

        # Filter by plan
        plan_id = self.request.query_params.get("plan_id")
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)

        return queryset

    @action(detail=False, methods=["get"])
    def by_user(self, request):
        """Get billing plan for a specific user"""
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ubp = UserBillingPlan.objects.select_related("plan").get(user_id=user_id)
            return Response(UserBillingPlanSerializer(ubp).data)
        except UserBillingPlan.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


# ============================================
# SUBSCRIPTION VIEWS
# ============================================


class SubscriptionCRUDView(BaseCRUDViewset):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        queryset = Subscription.objects.select_related("user").all()

        # Filter by status
        sub_status = self.request.query_params.get("status")
        if sub_status:
            queryset = queryset.filter(status=sub_status)

        # Filter by plan
        plan = self.request.query_params.get("plan")
        if plan:
            queryset = queryset.filter(plan=plan)

        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset

    @action(detail=False, methods=["get"])
    def active_count(self, request):
        """Get count of active subscriptions"""
        count = Subscription.objects.filter(status="active").count()
        return Response({"active_subscriptions": count})

    @action(detail=False, methods=["get"])
    def by_user(self, request):
        """Get subscription for a specific user"""
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"error": "user_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            sub = Subscription.objects.get(user_id=user_id)
            return Response(SubscriptionSerializer(sub).data)
        except Subscription.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)


# ============================================
# PAYMENT VIEWS
# ============================================


class PaymentCRUDView(BaseCRUDViewset):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def get_queryset(self):
        queryset = Payment.objects.select_related("user", "subscription").filter(
            user=self.request.user
        )

        # Filter by status
        pstatus = self.request.query_params.get("status")
        if pstatus:
            queryset = queryset.filter(status=pstatus)

        # Filter by payment method
        method = self.request.query_params.get("method")
        if method:
            queryset = queryset.filter(payment_method=method)

        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset.order_by("-created_at")

    @action(detail=False, methods=["get"])
    def by_user(self, request):
        """Get all payments for a user"""
        user_id = request.query_params.get("user_id")
        payments = Payment.objects.filter(user_id=user_id).order_by("-created_at")
        return Response(PaymentSerializer(payments, many=True).data)

    @action(detail=False, methods=["get"])
    def total_revenue(self, request):
        """Get total revenue"""
        total = Payment.objects.filter(status="completed").aggregate(
            total=Sum("amount")
        )
        return Response({"total_revenue": total["total"] or 0})


# ============================================
# INVOICE VIEWS
# ============================================


class InvoiceCRUDView(BaseCRUDViewset):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        queryset = Invoice.objects.select_related("user", "payment").filter(
            user=self.request.user
        )

        # Filter by status
        istatus = self.request.query_params.get("status")
        if istatus:
            queryset = queryset.filter(status=istatus)

        return queryset.order_by("-created_at")

    @action(detail=False, methods=["get"])
    def generate_number(self, request):
        """Generate next invoice number"""
        last = Invoice.objects.order_by("-created_at").first()
        if last and last.invoice_number.isdigit():
            next_num = int(last.invoice_number) + 1
        else:
            next_num = 1001
        return Response({"next_number": str(next_num)})

    @action(detail=True, methods=["get"])
    def with_items(self, request, pk=None):
        """Get invoice with all items"""
        invoice = self.get_object()
        items = invoice.items.all()
        return Response(
            {
                "invoice": InvoiceSerializer(invoice).data,
                "items": InvoiceItemSerializer(items, many=True).data,
            }
        )


class InvoiceItemCRUDView(BaseCRUDViewset):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer

    def get_queryset(self):
        invoice_id = self.kwargs.get("invoice_id")
        if invoice_id:
            return InvoiceItem.objects.filter(invoice_id=invoice_id)
        return InvoiceItem.objects.all()


# ============================================
# TEMPLATE VIEWS
# ============================================


class TemplateCRUDView(BaseCRUDViewset):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TemplateDetailSerializer
        return TemplateSerializer

    def get_queryset(self):
        queryset = Template.objects.all()

        # Filter by active
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        # Filter by price
        is_free = self.request.query_params.get("is_free")
        if is_free is not None:
            queryset = queryset.filter(is_free=is_free.lower() == "true")

        is_premium = self.request.query_params.get("is_premium")
        if is_premium is not None:
            queryset = queryset.filter(is_premium=is_premium.lower() == "true")

        # Price range
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Search
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(tags__contains=[search])
            )

        return queryset.order_by("-created_at")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Free templates are accessible to all
        if not instance.is_free:
            if request.user.is_authenticated:
                from core.plan_checker import check_template_access
                allowed, reason = check_template_access(request.user, instance)
                if not allowed:
                    return Response(
                        {"error": reason or "Your plan does not allow accessing this template."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            else:
                return Response(
                    {"error": "Authentication required to view template details"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_category(self, request):
        """Get templates by category"""
        category = request.query_params.get("category")
        templates = Template.objects.filter(category=category, is_active=True)
        return Response(TemplateSerializer(templates, many=True).data)

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Search templates"""
        query = request.query_params.get("q", "")
        templates = Template.objects.filter(is_active=True).filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        return Response(TemplateSerializer(templates, many=True).data)

    @action(detail=False, methods=["get"])
    def top_rated(self, request):
        """Get top rated templates"""
        limit = int(request.query_params.get("limit", 10))
        templates = Template.objects.filter(is_active=True, rating__gt=0).order_by(
            "-rating", "-total_reviews"
        )[:limit]
        return Response(TemplateSerializer(templates, many=True).data)

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Search templates"""
        query = request.query_params.get("q", "")
        templates = Template.objects.filter(is_active=True).filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        return Response(TemplateSerializer(templates, many=True).data)

    @action(detail=False, methods=["get"])
    def top_rated(self, request):
        """Get top rated templates"""
        limit = int(request.query_params.get("limit", 10))
        templates = Template.objects.filter(is_active=True, rating__gt=0).order_by(
            "-rating", "-total_reviews"
        )[:limit]
        return Response(TemplateSerializer(templates, many=True).data)

    @action(detail=False, methods=["get"])
    def most_downloaded(self, request):
        """Get most downloaded templates"""
        limit = int(request.query_params.get("limit", 10))
        templates = Template.objects.filter(is_active=True).order_by("-download_count")[
            :limit
        ]
        return Response(TemplateSerializer(templates, many=True).data)

    @action(detail=True, methods=["post"])
    def increment_download(self, request, pk=None):
        """Increment download count"""
        template = self.get_object()
        template.download_count += 1
        template.save()
        return Response({"download_count": template.download_count})


# ============================================
# USER TEMPLATE VIEWS
# ============================================


class UserTemplateCRUDView(BaseCRUDViewset):
    queryset = UserTemplate.objects.all()
    serializer_class = UserTemplateSerializer

    def get_queryset(self):
        queryset = UserTemplate.objects.select_related(
            "user", "template", "website"
        ).filter(user=self.request.user)

        # Filter by template
        template_id = self.request.query_params.get("template_id")
        if template_id:
            queryset = queryset.filter(template_id=template_id)

        # Filter by website
        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        return queryset.order_by("-purchased_at")

    @action(detail=False, methods=["get"])
    def by_user(self, request):
        """Get templates for a user"""
        user_id = request.query_params.get("user_id")
        templates = UserTemplate.objects.filter(user_id=user_id).select_related(
            "template"
        )
        return Response(UserTemplateSerializer(templates, many=True).data)


# ============================================
# TEMPLATE PURCHASE VIEWS
# ============================================


class TemplatePurchaseCRUDView(BaseCRUDViewset):
    queryset = TemplatePurchase.objects.all()
    serializer_class = TemplatePurchaseSerializer

    def get_queryset(self):
        queryset = TemplatePurchase.objects.select_related(
            "user", "template", "user_template"
        ).filter(user=self.request.user)

        # Filter by status
        pstatus = self.request.query_params.get("status")
        if pstatus:
            queryset = queryset.filter(payment_status=pstatus)

        return queryset.order_by("-created_at")

    @action(detail=False, methods=["get"])
    def by_user(self, request):
        """Get purchases for a user"""
        user_id = request.query_params.get("user_id")
        purchases = TemplatePurchase.objects.filter(user_id=user_id).select_related(
            "template"
        )
        return Response(TemplatePurchaseSerializer(purchases, many=True).data)


# ============================================
# TEMPLATE ORDER VIEWS
# ============================================


class TemplateOrderCRUDView(BaseCRUDViewset):
    queryset = TemplateOrder.objects.all()
    serializer_class = TemplateOrderSerializer

    def get_queryset(self):
        queryset = TemplateOrder.objects.select_related(
            "user", "invoice", "delivered_template"
        ).filter(user=self.request.user)

        # Filter by status
        ostatus = self.request.query_params.get("status")
        if ostatus:
            queryset = queryset.filter(status=ostatus)

        # Filter by order type
        order_type = self.request.query_params.get("order_type")
        if order_type:
            queryset = queryset.filter(order_type=order_type)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        """Set user to current user"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        """Get pending orders"""
        orders = TemplateOrder.objects.filter(status="pending")
        return Response(TemplateOrderSerializer(orders, many=True).data)

    @action(detail=True, methods=["post"])
    def quote(self, request, pk=None):
        """Add quote to order"""
        order = self.get_object()
        order.quoted_price = request.data.get("price")
        order.status = "quoted"
        order.save()
        return Response(TemplateOrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve order"""
        order = self.get_object()
        order.status = "approved"
        order.save()
        return Response(TemplateOrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Complete order with delivered template"""
        order = self.get_object()
        order.delivered_template_id = request.data.get("template_id")
        order.status = "completed"
        order.save()
        return Response(TemplateOrderSerializer(order).data)


# ============================================
# WEBSITE VIEWS
# ============================================


class WebsiteCRUDView(BaseCRUDViewset):
    queryset = Website.objects.all()
    serializer_class = WebsiteSerializer

    def get_queryset(self):
        queryset = Website.objects.select_related("owner", "template_used").filter(
            owner=self.request.user
        )

        # Filter by status
        wstatus = self.request.query_params.get("status")
        if wstatus:
            queryset = queryset.filter(status=wstatus)

        # Filter by published
        is_published = self.request.query_params.get("is_published")
        if is_published is not None:
            queryset = queryset.filter(is_published=is_published.lower() == "true")

        # Filter by slug
        slug = self.request.query_params.get("slug")
        if slug:
            queryset = queryset.filter(slug=slug)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        """Set owner to current user"""
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["get"])
    def count(self, request):
        """Count websites for current user"""
        count = Website.objects.filter(owner=request.user).count()
        return Response({"count": count})

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish website"""
        website = self.get_object()
        website.is_published = True
        website.status = "published"
        website.published_at = timezone.now()
        website.save()
        return Response(WebsiteSerializer(website).data)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        """Unpublish website"""
        website = self.get_object()
        website.is_published = False
        website.status = "draft"
        website.save()
        return Response(WebsiteSerializer(website).data)


# ============================================
# TEAM MEMBER VIEWS
# ============================================


class TeamMemberCRUDView(BaseCRUDViewset):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = TeamMember.objects.select_related(
            "user", "website", "invited_by"
        ).filter(website_id__in=user_websites)

        # Filter by user
        user_id = self.request.query_params.get("user_id")
        if user_id:
            queryset = queryset.filter(user_id=user_id, is_active=True)

        # Filter by role
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)

        return queryset

    @action(detail=False, methods=["get"])
    def by_website(self, request):
        """Get team members for a website"""
        website_id = request.query_params.get("website_id")
        members = TeamMember.objects.filter(
            website_id=website_id, is_active=True
        ).select_related("user")
        return Response(TeamMemberSerializer(members, many=True).data)

    @action(detail=False, methods=["get"])
    def check(self, request):
        """Check if user is member of website"""
        website_id = request.query_params.get("website_id")
        user_id = request.query_params.get("user_id")
        is_member = TeamMember.objects.filter(
            website_id=website_id, user_id=user_id, is_active=True
        ).exists()
        return Response({"is_member": is_member})


# ============================================
# DOMAIN VIEWS
# ============================================

# ============================================
# BLOG / CMS VIEWS
# ============================================

from core.models import BlogPost, Category, Tag


class BlogPostCRUDView(BaseCRUDViewset):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer

    def get_queryset(self):
        queryset = BlogPost.objects.all()
        # Filter by status, website, author
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)
        author_id = self.request.query_params.get("author_id")
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        # Restrict to posts where user is author OR website owner
        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.filter(
                Q(author=user) | Q(website__owner=user)
            )
        return queryset.order_by("-published_at", "-created_at")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class CategoryCRUDView(BaseCRUDViewset):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_queryset(self):
        queryset = Category.objects.all()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by("name")


class TagCRUDView(BaseCRUDViewset):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def get_queryset(self):
        queryset = Tag.objects.all()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by("name")


class DomainCRUDView(BaseCRUDViewset):
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = Domain.objects.select_related("website").filter(
            website_id__in=user_websites
        )

        # Filter by verified
        is_verified = self.request.query_params.get("is_verified")
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == "true")

        return queryset

    @action(detail=False, methods=["get"])
    def by_website(self, request):
        """Get domains for a website"""
        website_id = request.query_params.get("website_id")
        domains = Domain.objects.filter(website_id=website_id)
        return Response(DomainSerializer(domains, many=True).data)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        """Verify domain"""
        domain = self.get_object()
        code = request.data.get("verification_code")
        if domain.verification_code == code:
            domain.is_verified = True
            domain.ssl_enabled = True
            domain.save()
            return Response(DomainSerializer(domain).data)
        return Response(
            {"error": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=["post"])
    def set_primary(self, request, pk=None):
        """Set as primary domain"""
        domain = self.get_object()
        Domain.objects.filter(website_id=domain.website_id).update(is_primary=False)
        domain.is_primary = True
        domain.save()
        return Response(DomainSerializer(domain).data)


# ============================================
# PAGE ELEMENT VIEWS
# ============================================


class PageElementCRUDView(BaseCRUDViewset):
    queryset = PageElement.objects.all()
    serializer_class = PageElementSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = PageElement.objects.select_related("website", "parent").filter(
            website_id__in=user_websites
        )

        # Filter by page
        page_name = self.request.query_params.get("page_name")
        if page_name:
            queryset = queryset.filter(page_name=page_name)

        # Filter by visibility
        is_visible = self.request.query_params.get("is_visible")
        if is_visible is not None:
            queryset = queryset.filter(is_visible=is_visible.lower() == "true")

        return queryset.order_by("position")

    @action(detail=False, methods=["get"])
    def by_page(self, request):
        """Get elements for a page"""
        website_id = request.query_params.get("website_id")
        page_name = request.query_params.get("page_name", "index")
        elements = PageElement.objects.filter(
            website_id=website_id, page_name=page_name
        ).order_by("position")
        return Response(PageElementSerializer(elements, many=True).data)

    @action(detail=False, methods=["get"])
    def tree(self, request):
        """Get hierarchical page tree"""
        website_id = request.query_params.get("website_id")
        page_name = request.query_params.get("page_name", "index")

        elements = PageElement.objects.filter(
            website_id=website_id, page_name=page_name
        ).order_by("position")

        # Build tree structure
        root_elements = elements.filter(parent__isnull=True)
        result = []

        def build_tree(element, children):
            return {
                "id": element.id,
                "type": element.element_type,
                "data": element.element_data,
                "position": element.position,
                "children": children,
            }

        for elem in root_elements:
            children = elements.filter(parent_id=elem.id)
            result.append(build_tree(elem, [build_tree(c, []) for c in children]))

        return Response(result)

    @action(detail=True, methods=["post"])
    def reorder(self, request, pk=None):
        """Reorder element"""
        element = self.get_object()
        element.position = request.data.get("position", element.position)
        element.save()
        return Response(PageElementSerializer(element).data)


# ============================================
# ANALYTICS VIEWS
# ============================================


class AnalyticsOverviewView(BaseCRUDViewset):
    """Analytics overview for dashboard.

    Endpoint: GET /api/analytics/overview/

    Returns JSON in the shape expected by frontend/src/App.js.
    """

    def get_permissions(self):
        return [IsAuthenticated()]

    def _check_analytics_access(self, request):
        from core.plan_checker import check_analytics
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not check_analytics(request.user):
            return Response(
                {"error": "Analytics is available on Pro, Business, and Enterprise plans only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def _get_user_website_id(self, request):
        website_id = request.query_params.get("website_id")
        if website_id:
            try:
                wid = int(website_id)
            except ValueError:
                return Response(
                    {"error": "website_id must be an integer"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            exists = Website.objects.filter(owner=request.user, id=wid).exists()
            if not exists:
                return Response(
                    {"error": "Website not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return wid

        # Default: first website
        website = Website.objects.filter(owner=request.user).order_by("-created_at").first()
        if not website:
            return Response(
                {"error": "No websites found for this user"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return website.id

    def get(self, request):
        denial = self._check_analytics_access(request)
        if denial:
            return denial

        website_id = self._get_user_website_id(request)
        if isinstance(website_id, Response):
            return website_id

        days_range = int(request.query_params.get("days", 30))

        base_qs = PageView.objects.filter(website_id=website_id)

        # Visitors/pages today, yesterday, week, month
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        start_week = today - timedelta(days=7)
        start_month = today - timedelta(days=30)

        def count_for_date(d):
            return base_qs.filter(created_at__date=d).count()

        visitors_today = count_for_date(today)
        visitors_yesterday = count_for_date(yesterday)
        visitors_week = base_qs.filter(created_at__date__gte=start_week).count()
        visitors_month = base_qs.filter(created_at__date__gte=start_month).count()

        def pct_change(current, prev):
            if prev == 0:
                return 100.0 if current > 0 else 0.0
            return ((current - prev) / prev) * 100.0

        visitors_change_today = pct_change(visitors_today, visitors_yesterday)
        visitors_change_week = pct_change(visitors_week, base_qs.filter(created_at__date__gte=start_week - timedelta(days=7), created_at__date__lt=start_week).count())
        visitors_change_month = pct_change(visitors_month, base_qs.filter(created_at__date__gte=start_month - timedelta(days=30), created_at__date__lt=start_month).count())

        # Traffic sources
        # Group by referrer domain (simple): if referrer present, use it; else 'Direct'
        traffic_qs = base_qs.exclude(created_at__isnull=True)
        traffic = (
            traffic_qs
            .values_list("referrer", flat=True)
        )

        # Aggregate in Python to keep it database-agnostic
        traffic_map = {}
        for ref in traffic:
            name = "Direct" if not ref else ref
            # Keep only hostname-ish part
            if isinstance(name, str) and "/" in name:
                name = name.split("/")[2] if len(name.split("/")) > 2 else name
            traffic_map[name] = traffic_map.get(name, 0) + 1

        total_traffic = sum(traffic_map.values()) or 1
        traffic_sources = [
            {"name": k, "value": round((v / total_traffic) * 100, 2), "change": 0.0}
            for k, v in sorted(traffic_map.items(), key=lambda x: x[1], reverse=True)[:4]
        ]

        # Devices distribution
        devices_rows = (
            base_qs.values("device_type").annotate(views=Count("id")).order_by("-views")
        )
        total_devices = base_qs.count() or 1
        devices = [
            {
                "name": (row["device_type"] or "unknown").capitalize(),
                "value": round((row["views"] / total_devices) * 100, 2),
                "change": 0.0,
            }
            for row in devices_rows[:3]
        ]

        # Geographic distribution (country/city) - use country if present
        geo_rows = (
            base_qs.exclude(country__isnull=True)
            .exclude(country="")
            .values("country")
            .annotate(views=Count("id"))
            .order_by("-views")
        )
        total_geo = base_qs.exclude(country__isnull=True).exclude(country="").count() or 1
        geographic = [
            {
                "country": r["country"],
                "visitors": int(r["views"]),
                "change": 0.0,
            }
            for r in geo_rows[:5]
        ]

        # Pages
        pages_rows = (
            base_qs.values("page_url", "page_title")
            .annotate(views=Count("id"))
            .order_by("-views")
        )
        pages = [
            {
                "path": (r["page_url"] or "/"),
                "views": int(r["views"]),
                "change": 0.0,
            }
            for r in pages_rows[:5]
        ]

        # Conversions: use core.models.Conversion
        conv_base = Conversion.objects.filter(website_id=website_id)
        conv_total = conv_base.count()
        conv_today = conv_base.filter(created_at__date=today).count()
        conv_week = conv_base.filter(created_at__date__gte=start_week).count()
        conv_month = conv_base.filter(created_at__date__gte=start_month).count()

        conv_change_today = pct_change(conv_today, conv_base.filter(created_at__date=yesterday).count())
        conv_change_week = pct_change(
            conv_week,
            conv_base.filter(created_at__date__gte=start_week - timedelta(days=7), created_at__date__lt=start_week).count(),
        )
        conv_change_month = pct_change(
            conv_month,
            conv_base.filter(created_at__date__gte=start_month - timedelta(days=30), created_at__date__lt=start_month).count(),
        )

        visitor_den = visitors_today or 1
        conversion_rate = round((conv_today / visitor_den) * 100, 2)

        # Sales revenue: no explicit Revenue model in code; approximate by Conversion.value
        sales_base = conv_base.exclude(value__isnull=True)
        sales_total = sales_base.aggregate(total=Sum("value"))["total"] or 0
        sales_today = sales_base.filter(created_at__date=today).aggregate(total=Sum("value"))["total"] or 0
        sales_week = sales_base.filter(created_at__date__gte=start_week).aggregate(total=Sum("value"))["total"] or 0
        sales_month = sales_base.filter(created_at__date__gte=start_month).aggregate(total=Sum("value"))["total"] or 0

        # percent change for revenue vs previous periods
        sales_yesterday = sales_base.filter(created_at__date=yesterday).aggregate(total=Sum("value"))["total"] or 0
        sales_change_today = pct_change(float(sales_today), float(sales_yesterday))

        prev_week = sales_base.filter(created_at__date__gte=start_week - timedelta(days=7), created_at__date__lt=start_week).aggregate(total=Sum("value"))["total"] or 0
        sales_change_week = pct_change(float(sales_week), float(prev_week))

        prev_month = sales_base.filter(created_at__date__gte=start_month - timedelta(days=30), created_at__date__lt=start_month).aggregate(total=Sum("value"))["total"] or 0
        sales_change_month = pct_change(float(sales_month), float(prev_month))

        return Response(
            {
                "visitors": {
                    "today": visitors_today,
                    "yesterday": visitors_yesterday,
                    "week": visitors_week,
                    "month": visitors_month,
                    "changeToday": round(visitors_change_today, 2),
                    "changeWeek": round(visitors_change_week, 2),
                    "changeMonth": round(visitors_change_month, 2),
                },
                "trafficSources": traffic_sources,
                "geographic": geographic,
                "conversions": {
                    "total": conv_total,
                    "today": conv_today,
                    "week": conv_week,
                    "month": conv_month,
                    "changeToday": round(conv_change_today, 2),
                    "changeWeek": round(conv_change_week, 2),
                    "changeMonth": round(conv_change_month, 2),
                    "rate": conversion_rate,
                },
                "sales": {
                    "total": float(sales_total),
                    "today": float(sales_today),
                    "week": float(sales_week),
                    "month": float(sales_month),
                    "changeToday": round(sales_change_today, 2),
                    "changeWeek": round(sales_change_week, 2),
                    "changeMonth": round(sales_change_month, 2),
                },
                "devices": devices,
                "pages": pages,
            }
        )


class PageViewAnalyticsView(BaseCRUDViewset):
    """Analytics endpoints for page views.

    This implementation assumes PageView model exists in core/models.py.
    """

    queryset = PageView.objects.all()
    serializer_class = None

    def get_permissions(self):
        return [AllowAny()]

    def _check_analytics_access(self, request):
        """Check if user has analytics feature on their plan"""
        from core.plan_checker import check_analytics
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not check_analytics(request.user):
            return Response(
                {"error": "Analytics is available on Pro, Business, and Enterprise plans only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def _website_queryset_for_user(self, request, website_id):
        user_websites = Website.objects.filter(owner=request.user).values_list("id", flat=True)
        return PageView.objects.filter(website_id=website_id, website_id__in=user_websites)

    def _get_website_id(self, request):
        return request.parser_context.get("kwargs", {}).get("website_id")

    def list(self, request):
        denial = self._check_analytics_access(request)
        if denial:
            return denial

        website_id = request.query_params.get("website_id")
        if not website_id:
            return Response({"error": "website_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = self._website_queryset_for_user(request, website_id)
        # Lightweight: return latest 50 records
        latest = qs.order_by("-created_at")[:50]
        data = [
            {
                "id": v.id,
                "page_url": v.page_url,
                "page_title": v.page_title,
                "referrer": v.referrer,
                "ip_address": v.ip_address,
                "device_type": v.device_type,
                "browser": v.browser,
                "created_at": v.created_at,
            }
            for v in latest
        ]
        return Response({"results": data, "count": qs.count()})

    @action(detail=False, methods=["get"])
    def daily(self, request, website_id=None):
        denial = self._check_analytics_access(request)
        if denial:
            return denial
        if website_id is None:
            website_id = request.query_params.get("website_id")
        if not website_id:
            return Response({"error": "website_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = self._website_queryset_for_user(request, website_id)
        days = int(request.query_params.get("days", 30))
        start = timezone.now().date() - timedelta(days=days)
        qs = qs.filter(created_at__date__gte=start)

        # Aggregate by date
        rows = (
            qs.annotate(d=TruncDate("created_at"))
            .values("d")
            .annotate(visitors=Count("id"), page_views=Count("id"))
            .order_by("d")
        )

        return Response(
            {
                "website_id": int(website_id),
                "days": days,
                "data": [
                    {
                        "date": r["d"].isoformat() if r["d"] else None,
                        "visitors": r["visitors"],
                        "page_views": r["page_views"],
                    }
                    for r in rows
                ],
            }
        )

    @action(detail=False, methods=["get"])
    def total(self, request, website_id=None):
        denial = self._check_analytics_access(request)
        if denial:
            return denial
        if website_id is None:
            website_id = request.query_params.get("website_id")
        if not website_id:
            return Response({"error": "website_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = self._website_queryset_for_user(request, website_id)
        total_views = qs.count()
        return Response(
            {
                "website_id": int(website_id),
                "total": total_views,
            }
        )

    @action(detail=False, methods=["get"])
    def referrers(self, request, website_id=None):
        denial = self._check_analytics_access(request)
        if denial:
            return denial
        if website_id is None:
            website_id = request.query_params.get("website_id")
        if not website_id:
            return Response({"error": "website_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = self._website_queryset_for_user(request, website_id)
        rows = (
            qs.exclude(referrer__isnull=True)
            .exclude(referrer="")
            .values("referrer")
            .annotate(views=Count("id"))
            .order_by("-views")[:20]
        )
        return Response({"data": list(rows)})

    @action(detail=False, methods=["get"])
    def devices(self, request, website_id=None):
        denial = self._check_analytics_access(request)
        if denial:
            return denial
        if website_id is None:
            website_id = request.query_params.get("website_id")
        if not website_id:
            return Response({"error": "website_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        qs = self._website_queryset_for_user(request, website_id)
        rows = (
            qs.values("device_type")
            .annotate(views=Count("id"))
            .order_by("-views")
        )
        return Response({"data": list(rows)})

    @action(detail=False, methods=["post"])
    def record(self, request):
        """Record a page view event.

        Intended to be called by a client-side tracking script on published websites.
        """
        denial = self._check_analytics_access(request)
        if denial:
            # allow public websites in future; for Phase 1 keep strict
            return denial

        website_id = request.data.get("website_id")
        page_url = request.data.get("page_url")
        if not website_id or not page_url:
            return Response(
                {"error": "website_id and page_url are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self._website_queryset_for_user(request, website_id)
        _ = qs  # just to validate access

        v = PageView.objects.create(
            website_id=website_id,
            page_url=page_url,
            page_title=request.data.get("page_title"),
            referrer=request.data.get("referrer"),
            ip_address=request.data.get("ip_address"),
            user_agent=request.data.get("user_agent"),
            device_type=request.data.get("device_type", "unknown"),
            browser=request.data.get("browser"),
            country=request.data.get("country"),
            city=request.data.get("city"),
            session_id=request.data.get("session_id"),
        )
        return Response({"success": True, "id": v.id})



# ============================================
# SEO VIEWS
# ============================================


class SeoSettingsCRUDView(BaseCRUDViewset):
    """CRUD for SeoSettings — one record per website."""
    queryset = SeoSettings.objects.all()
    serializer_class = SeoSettingsSerializer

    def get_queryset(self):
        qs = SeoSettings.objects.select_related("website").all()
        website_id = self.request.query_params.get("website_id")
        if website_id:
            qs = qs.filter(website_id=website_id)
        if not self.request.user.is_staff:
            qs = qs.filter(website__owner=self.request.user)
        return qs

    @action(detail=False, methods=["get"])
    def by_website(self, request):
        """GET /api/crud/seo-settings/by_website/?website_id=<id>"""
        website_id = request.query_params.get("website_id")
        if not website_id:
            return Response({"error": "website_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            seo = SeoSettings.objects.get(website_id=website_id, website__owner=request.user)
        except SeoSettings.DoesNotExist:
            return Response({"error": "SEO settings not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(SeoSettingsSerializer(seo).data)


class SitemapUrlCRUDView(BaseCRUDViewset):
    """CRUD for SitemapUrl entries."""
    queryset = SitemapUrl.objects.all()
    serializer_class = SitemapUrlSerializer

    def get_queryset(self):
        qs = SitemapUrl.objects.select_related("website").all()
        website_id = self.request.query_params.get("website_id")
        if website_id:
            qs = qs.filter(website_id=website_id)
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        if not self.request.user.is_staff:
            qs = qs.filter(website__owner=self.request.user)
        return qs.order_by("-priority", "loc")

    @action(detail=False, methods=["get"])
    def active(self, request):
        """GET /api/crud/sitemap-urls/active/?website_id=<id> — only active URLs"""
        website_id = self.request.query_params.get("website_id")
        qs = SitemapUrl.objects.filter(is_active=True)
        if website_id:
            qs = qs.filter(website_id=website_id)
        return Response(SitemapUrlSerializer(qs, many=True).data)

    @action(detail=False, methods=["post"])
    def auto_generate(self, request):
        """POST /api/crud/sitemap-urls/auto_generate/ — auto-create sitemap entries for website"""
        website_id = request.data.get("website_id")
        if not website_id:
            return Response({"error": "website_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            website = Website.objects.get(id=website_id, owner=request.user)
        except Website.DoesNotExist:
            return Response({"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND)

        base_url = request.build_absolute_uri("/").rstrip("/")

        try:
            seo = website.seo_settings
            freq = seo.sitemap_frequency
        except SeoSettings.DoesNotExist:
            freq = "weekly"

        entries_created = []

        # Homepage
        home_url = f"{base_url}/website/{website.slug}/"
        url_obj, _ = SitemapUrl.objects.update_or_create(
            website=website, loc=home_url,
            defaults={"lastmod": timezone.now(), "changefreq": freq, "priority": 1.0, "is_active": True},
        )
        entries_created.append(url_obj)

        # Extra published pages (Page model) + page_name elements
        for page in Page.objects.filter(website=website, is_published=True).only("slug"):
            if page.is_homepage:
                continue
            pg_url = f"{base_url}/website/{website.slug}/{page.slug}/"
            url_obj, _ = SitemapUrl.objects.update_or_create(
                website=website, loc=pg_url,
                defaults={"lastmod": timezone.now(), "changefreq": freq, "priority": 0.85, "is_active": True},
            )
            entries_created.append(url_obj)

        # page_elements with unique page_name values
        page_names = PageElement.objects.filter(website=website, is_visible=True) \
            .values_list("page_name", flat=True).distinct()
        for page_name in page_names:
            if page_name == "index":
                continue
            pe_url = f"{base_url}/website/{website.slug}/{page_name}/"
            url_obj, _ = SitemapUrl.objects.update_or_create(
                website=website, loc=pe_url,
                defaults={"lastmod": timezone.now(), "changefreq": freq, "priority": 0.9, "is_active": True},
            )
            entries_created.append(url_obj)

        # Published blog posts
        for post in BlogPost.objects.filter(website=website, status="published").only("slug"):
            post_url = f"{base_url}/blog/{post.slug}/"
            url_obj, _ = SitemapUrl.objects.update_or_create(
                website=website, loc=post_url,
                defaults={"lastmod": timezone.now(), "changefreq": "weekly", "priority": 0.8, "is_active": True},
            )
            entries_created.append(url_obj)

        # Active products
        for prod in Product.objects.filter(website=website, is_active=True).only("slug"):
            prod_url = f"{base_url}/store/{website.slug}/products/{prod.slug}/"
            url_obj, _ = SitemapUrl.objects.update_or_create(
                website=website, loc=prod_url,
                defaults={"lastmod": timezone.now(), "changefreq": "weekly", "priority": 0.8, "is_active": True},
            )
            entries_created.append(url_obj)

        return Response(SitemapUrlSerializer(entries_created, many=True).data)


# ============================================
# CODE EXPORT VIEWS
# ============================================


class ExportedWebsiteCRUDView(BaseCRUDViewset):
    queryset = ExportedWebsite.objects.all()
    serializer_class = ExportedWebsiteSerializer

    def get_queryset(self):
        queryset = ExportedWebsite.objects.select_related("website").filter(
            website__owner=self.request.user
        )

        # Filter by export type
        export_type = self.request.query_params.get("export_type")
        if export_type:
            queryset = queryset.filter(export_type=export_type)

        # Filter by status
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        """Set website to current user's website"""
        website_id = self.request.data.get("website")
        try:
            website = Website.objects.get(id=website_id, owner=self.request.user)
            serializer.save(website=website)
        except Website.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Website not found or access denied")

    @action(detail=False, methods=["get"])
    def completed(self, request):
        """Get completed exports"""
        exports = ExportedWebsite.objects.filter(
            website__owner=request.user, status="completed"
        )
        return Response(ExportedWebsiteSerializer(exports, many=True).data)

    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        """Retry a failed export"""
        export = self.get_object()
        if export.status == "failed":
            export.status = "pending"
            export.error_message = ""
            export.save()
            return Response(ExportedWebsiteSerializer(export).data)
        return Response(
            {"error": "Only failed exports can be retried"},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================
# FORM & CONTACT VIEWS
# ============================================


class FormCRUDView(BaseCRUDViewset):
    queryset = Form.objects.all()
    serializer_class = FormSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = Form.objects.filter(website_id__in=user_websites)

        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        """Get all submissions for a form"""
        form = self.get_object()
        submissions = FormSubmission.objects.filter(form_name=form.slug, website=form.website)
        return Response(FormSubmissionSerializer(submissions, many=True).data)


class FormFieldCRUDView(BaseCRUDViewset):
    queryset = FormField.objects.all()
    serializer_class = FormFieldSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = FormField.objects.filter(form__website_id__in=user_websites)

        form_id = self.request.query_params.get("form_id")
        if form_id:
            queryset = queryset.filter(form_id=form_id)

        return queryset.order_by("sort_order")


class FormSubmissionCRUDView(BaseCRUDViewset):
    queryset = FormSubmission.objects.all()
    serializer_class = FormSubmissionSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = FormSubmission.objects.filter(website_id__in=user_websites)

        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        return queryset.order_by("-submitted_at")


class NewsletterSubscriberCRUDView(BaseCRUDViewset):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = NewsletterSubscriber.objects.filter(website_id__in=user_websites)

        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset.order_by("-subscribed_at")

    @action(detail=False, methods=["post"])
    def subscribe(self, request):
        """Public endpoint for newsletter subscription"""
        email = request.data.get("email")
        website_id = request.data.get("website_id")
        source = request.data.get("source", "website")

        if not email or not website_id:
            return Response(
                {"error": "email and website_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subscriber, created = NewsletterSubscriber.objects.get_or_create(
                email=email,
                website_id=website_id,
                defaults={"source": source, "ip_address": request.META.get("REMOTE_ADDR")}
            )
            if not created and not subscriber.is_active:
                subscriber.is_active = True
                subscriber.unsubscribed_at = None
                subscriber.source = source
                subscriber.save()
            return Response(NewsletterSubscriberSerializer(subscriber).data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"])
    def unsubscribe(self, request):
        """Public endpoint for newsletter unsubscription"""
        email = request.data.get("email")
        website_id = request.data.get("website_id")

        if not email or not website_id:
            return Response(
                {"error": "email and website_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            subscriber = NewsletterSubscriber.objects.get(
                email=email, website_id=website_id, is_active=True
            )
            subscriber.is_active = False
            subscriber.unsubscribed_at = timezone.now()
            subscriber.save()
            return Response({"success": True, "message": "Unsubscribed successfully"})
        except NewsletterSubscriber.DoesNotExist:
            return Response(
                {"error": "Subscriber not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class EmailCampaignCRUDView(BaseCRUDViewset):
    queryset = EmailCampaign.objects.all()
    serializer_class = EmailCampaignSerializer

    def get_queryset(self):
        user_websites = Website.objects.filter(owner=self.request.user).values_list(
            "id", flat=True
        )
        queryset = EmailCampaign.objects.filter(website_id__in=user_websites)

        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """Send email campaign"""
        campaign = self.get_object()
        campaign.status = "sending"
        campaign.save()

        # In production, this would queue emails via Celery
        # For now, we'll just mark it as sent
        campaign.delivered_count = campaign.total_recipients
        campaign.sent_at = timezone.now()
        campaign.status = "sent"
        campaign.save()

        return Response(EmailCampaignSerializer(campaign).data)


# ============================================
# E-COMMERCE VIEWS
# ============================================


class ProductCategoryCRUDView(BaseCRUDViewset):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer

    def get_queryset(self):
        queryset = ProductCategory.objects.all()
        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)
        return queryset.order_by("name")


class ProductCRUDView(BaseCRUDViewset):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related("category").all()
        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(
                Q(category__slug=category) | Q(category__name__icontains=category)
            )

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset.order_by("-created_at")


class ProductOptionCRUDView(BaseCRUDViewset):
    queryset = ProductOption.objects.all()
    serializer_class = ProductOptionSerializer

    def get_queryset(self):
        queryset = ProductOption.objects.select_related("product").all()
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset


class ProductVariantCRUDView(BaseCRUDViewset):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer

    def get_queryset(self):
        queryset = ProductVariant.objects.select_related("product").all()
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset


class CartCRUDView(BaseCRUDViewset):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user).order_by("-created_at")


class CartItemCRUDView(BaseCRUDViewset):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user).select_related("product", "variant")


class OrderCRUDView(BaseCRUDViewset):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")


class OrderItemCRUDView(BaseCRUDViewset):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

    def get_queryset(self):
        queryset = OrderItem.objects.select_related("order", "product").all()
        order_id = self.request.query_params.get("order_id")
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        return queryset


class CouponCRUDView(BaseCRUDViewset):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer

    def get_queryset(self):
        queryset = Coupon.objects.all()
        website_id = self.request.query_params.get("website_id")
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset.order_by("-created_at")


class ProductReviewCRUDView(BaseCRUDViewset):
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer

    def get_queryset(self):
        queryset = ProductReview.objects.select_related("product", "user").all()
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset.order_by("-created_at")


class WishlistCRUDView(BaseCRUDViewset):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related("website")
