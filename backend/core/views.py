from rest_framework import generics, permissions, viewsets, status
from django.contrib.auth.models import User
from django.utils import timezone
from .models import (
    Website, BillingPlan, BillingPlanFeature, UserBillingPlan,
    Template, UserTemplate, TemplatePurchase, TemplateOrder
)
from .serializers import (
    UserSerializer, RegisterSerializer, WebsiteSerializer,
    BillingPlanSerializer, UserBillingPlanSerializer, UserBillingPlanSelectSerializer,
    TemplateSerializer, TemplateDetailSerializer, UserTemplateSerializer,
    TemplatePurchaseSerializer, TemplateOrderSerializer, TemplateOrderCreateSerializer
)
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


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
        
        plan = serializer.validated_data['plan_id']
        user_billing_plan = UserBillingPlan.objects.get(user=request.user)
        user_billing_plan.plan = plan
        user_billing_plan.has_selected_plan = True
        user_billing_plan.selected_at = timezone.now()
        user_billing_plan.save()
        
        return Response({
            'message': 'Billing plan selected successfully',
            'billing_plan': UserBillingPlanSerializer(user_billing_plan).data
        })


class CheckPlanSelectionView(generics.GenericAPIView):
    """Check if user has selected a billing plan"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_billing_plan = UserBillingPlan.objects.get(user=request.user)
            return Response({
                'has_selected_plan': user_billing_plan.has_selected_plan,
                'billing_plan': UserBillingPlanSerializer(user_billing_plan).data if user_billing_plan.has_selected_plan else None
            })
        except UserBillingPlan.DoesNotExist:
            return Response({
                'has_selected_plan': False,
                'billing_plan': None
            })


# Template Views

class TemplateListView(generics.ListAPIView):
    """List all available templates"""
    serializer_class = TemplateSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Template.objects.filter(is_active=True)
        
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by free templates
        free_only = self.request.query_params.get('free')
        if free_only == 'true':
            queryset = queryset.filter(is_free=True)
        
        # Filter by premium templates
        premium_only = self.request.query_params.get('premium')
        if premium_only == 'true':
            queryset = queryset.filter(is_premium=True)
        
        return queryset


class TemplateDetailView(generics.RetrieveAPIView):
    """Get template details including content (for authenticated users who own it or for preview)"""
    queryset = Template.objects.filter(is_active=True)
    serializer_class = TemplateDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class UserTemplateViewSet(viewsets.ModelViewSet):
    """Manage user's purchased templates"""
    serializer_class = UserTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserTemplate.objects.filter(user=self.request.user)

    def create(self, request):
        """Create a copy of a template for the user (purchase/claim)"""
        template_id = request.data.get('template_id')
        custom_name = request.data.get('name', '')
        
        try:
            template = Template.objects.get(id=template_id, is_active=True)
        except Template.DoesNotExist:
            return Response(
                {'error': 'Template not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user already owns this template
        if UserTemplate.objects.filter(user=request.user, template=template).exists():
            return Response(
                {'error': 'You already own this template'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user template copy
        user_template = UserTemplate.objects.create(
            user=request.user,
            template=template,
            name=custom_name or f"My {template.name}",
            content=template.template_file
        )
        
        # Create purchase record
        TemplatePurchase.objects.create(
            user=request.user,
            template=template,
            user_template=user_template,
            amount=template.price if not template.is_free else 0,
            payment_status='completed' if template.is_free else 'pending'
        )
        
        return Response(
            UserTemplateSerializer(user_template).data,
            status=status.HTTP_201_CREATED
        )


class TemplatePurchaseView(generics.GenericAPIView):
    """Purchase a template"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        template_id = request.data.get('template_id')
        
        try:
            template = Template.objects.get(id=template_id, is_active=True)
        except Template.DoesNotExist:
            return Response(
                {'error': 'Template not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user already owns this template
        if UserTemplate.objects.filter(user=request.user, template=template).exists():
            return Response(
                {'error': 'You already own this template'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If template is free, create it immediately
        if template.is_free:
            user_template = UserTemplate.objects.create(
                user=request.user,
                template=template,
                name=f"My {template.name}",
                content=template.template_file
            )
            TemplatePurchase.objects.create(
                user=request.user,
                template=template,
                user_template=user_template,
                amount=0,
                payment_status='completed'
            )
            return Response({
                'message': 'Template purchased successfully',
                'user_template': UserTemplateSerializer(user_template).data
            })
        
        # For paid templates, create pending purchase (payment handled separately)
        purchase = TemplatePurchase.objects.create(
            user=request.user,
            template=template,
            amount=template.price,
            payment_status='pending'
        )
        
        return Response({
            'message': 'Purchase initiated',
            'purchase_id': str(purchase.id),
            'amount': str(purchase.amount),
            'template': TemplateSerializer(template).data
        })


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
                    {'error': 'Your plan does not allow custom template orders. Please upgrade your plan.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except UserBillingPlan.DoesNotExist:
            pass
        
        order = TemplateOrder.objects.create(
            user=request.user,
            **serializer.validated_data
        )
        
        return Response(
            TemplateOrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
