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
    BillingPlan,
    BillingPlanFeature,
    UserBillingPlan,
    Subscription,
    Website,
    TeamMember,
    Domain,
    PageElement,
    Template,
    UserTemplate,
    TemplatePurchase,
    TemplateOrder,
    Payment,
    Invoice,
    InvoiceItem,
    Website,
    TeamMember,
    Domain,
    PageElement,
)
from core.serializers import (
    BillingPlanSerializer,
    BillingPlanFeatureSerializer,
    UserBillingPlanSerializer,
    SubscriptionSerializer,
    WebsiteSerializer,
    TeamMemberSerializer,
    DomainSerializer,
    PageElementSerializer,
    TemplateSerializer,
    TemplateDetailSerializer,
    UserTemplateSerializer,
    TemplatePurchaseSerializer,
    TemplateOrderSerializer,
    PaymentSerializer,
    InvoiceSerializer,
    InvoiceItemSerializer,
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


class PageViewAnalyticsView(BaseCRUDViewset):
    """Analytics view - Note: PageView model not yet implemented in models.py"""

    queryset = []
    serializer_class = None

    def get_permissions(self):
        return [AllowAny()]

    def list(self, request):
        """Get page views for a website - requires PageView model"""
        return Response(
            {
                "message": "PageView model not implemented. Add PageView class to core/models.py",
                "note": "Use raw SQL from schema.sql for analytics until model is added",
            }
        )

    @action(detail=False, methods=["get"])
    def daily(self, request):
        return Response(
            {
                "message": "PageView model not implemented. Add PageView class to core/models.py"
            }
        )

    @action(detail=False, methods=["get"])
    def total(self, request):
        return Response(
            {
                "message": "PageView model not implemented. Add PageView class to core/models.py"
            }
        )

    @action(detail=False, methods=["get"])
    def referrers(self, request):
        return Response(
            {
                "message": "PageView model not implemented. Add PageView class to core/models.py"
            }
        )

    @action(detail=False, methods=["get"])
    def devices(self, request):
        return Response(
            {
                "message": "PageView model not implemented. Add PageView class to core/models.py"
            }
        )

    @action(detail=False, methods=["post"])
    def record(self, request):
        return Response(
            {
                "message": "PageView model not implemented. Add PageView class to core/models.py"
            }
        )
        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)

        # Get page views grouped by URL
        page_views = (
            PageView.objects.filter(website_id=website_id, viewed_at__gte=since)
            .values("page_url")
            .annotate(views=Count("id"), visitors=Count("visitor_id", distinct=True))
            .order_by("-views")
        )

        return Response(list(page_views))

    @action(detail=False, methods=["get"])
    def daily(self, request):
        """Get daily page views"""
        website_id = request.query_params.get("website_id")
        if not website_id:
            return Response(
                {"error": "website_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)

        daily = (
            PageView.objects.filter(website_id=website_id, viewed_at__gte=since)
            .annotate(date=TruncDate("viewed_at"))
            .values("date")
            .annotate(views=Count("id"), visitors=Count("visitor_id", distinct=True))
            .order_by("date")
        )

        return Response(list(daily))

    @action(detail=False, methods=["get"])
    def total(self, request):
        """Get total views for a website"""
        website_id = request.query_params.get("website_id")
        if not website_id:
            return Response(
                {"error": "website_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        stats = PageView.objects.filter(website_id=website_id).aggregate(
            total_views=Count("id"), unique_visitors=Count("visitor_id", distinct=True)
        )

        return Response(stats)

    @action(detail=False, methods=["get"])
    def referrers(self, request):
        """Get top referrers"""
        website_id = request.query_params.get("website_id")
        if not website_id:
            return Response(
                {"error": "website_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)

        referrers = (
            PageView.objects.filter(
                website_id=website_id, viewed_at__gte=since, referrer__isnull=False
            )
            .values("referrer")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        return Response(list(referrers))

    @action(detail=False, methods=["get"])
    def devices(self, request):
        """Get device breakdown"""
        website_id = request.query_params.get("website_id")
        if not website_id:
            return Response(
                {"error": "website_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        devices = (
            PageView.objects.filter(website_id=website_id)
            .values("device_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        return Response(list(devices))

    @action(detail=False, methods=["post"])
    def record(self, request):
        """Record a page view - Note: PageView model needs to be added to models.py"""
        return Response(
            {
                "message": "PageView model not yet implemented. Add PageView class to core/models.py",
                "note": "The core_pageview table exists in database but model not defined in Django",
            }
        )
