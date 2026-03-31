from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Website, Subscription, Payment, Invoice, InvoiceItem,
    BillingPlan, BillingPlanFeature, UserBillingPlan,
    Template, UserTemplate, TemplatePurchase, TemplateOrder
)


class WebsiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Website
        fields = ['id', 'name', 'content', 'created_at', 'updated_at']
        read_only_fields = ['owner']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


# Billing Plan Serializers

class BillingPlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingPlanFeature
        fields = ['id', 'feature_name', 'feature_value', 'is_included']


class BillingPlanSerializer(serializers.ModelSerializer):
    features = BillingPlanFeatureSerializer(many=True, read_only=True)
    
    class Meta:
        model = BillingPlan
        fields = [
            'id', 'name', 'slug', 'price', 'billing_period', 'description',
            'max_websites', 'max_templates_access', 'can_use_custom_domain',
            'can_remove_branding', 'can_access_api', 'can_have_team_members',
            'max_team_members', 'has_priority_support', 'has_analytics',
            'has_white_label', 'can_order_custom_template', 'is_active',
            'features', 'created_at'
        ]


class UserBillingPlanSerializer(serializers.ModelSerializer):
    plan = BillingPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=BillingPlan.objects.filter(is_active=True),
        source='plan',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = UserBillingPlan
        fields = [
            'id', 'user', 'plan', 'plan_id', 'has_selected_plan',
            'selected_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'has_selected_plan', 'selected_at']


class UserBillingPlanSelectSerializer(serializers.Serializer):
    """Serializer for selecting a billing plan after signup"""
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=BillingPlan.objects.filter(is_active=True)
    )


# Template Serializers

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'slug', 'description', 'category',
            'preview_image', 'price', 'is_free', 'is_premium',
            'required_plan', 'tags', 'is_active', 'created_at'
        ]


class TemplateDetailSerializer(serializers.ModelSerializer):
    """Detailed template serializer including template content"""
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'slug', 'description', 'category',
            'preview_image', 'template_file', 'price', 'is_free',
            'is_premium', 'required_plan', 'tags', 'is_active',
            'created_at', 'updated_at'
        ]


class UserTemplateSerializer(serializers.ModelSerializer):
    template = TemplateSerializer(read_only=True)
    
    class Meta:
        model = UserTemplate
        fields = [
            'id', 'user', 'template', 'name', 'content',
            'purchased_at', 'website', 'created_at'
        ]
        read_only_fields = ['user', 'template', 'purchased_at']


class TemplatePurchaseSerializer(serializers.ModelSerializer):
    template = TemplateSerializer(read_only=True)
    user_template = UserTemplateSerializer(read_only=True)
    
    class Meta:
        model = TemplatePurchase
        fields = [
            'id', 'user', 'template', 'user_template', 'amount',
            'payment_status', 'stripe_payment_id', 'created_at'
        ]
        read_only_fields = ['user', 'payment_status', 'stripe_payment_id']


# Invoice Serializers (must be before TemplateOrderSerializer)

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_amount', 'amount']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'user', 'amount_due', 'amount_paid',
            'currency', 'status', 'description', 'due_date', 'paid_at',
            'items', 'invoice_pdf_url', 'created_at', 'updated_at'
        ]


class TemplateOrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    
    class Meta:
        model = TemplateOrder
        fields = [
            'id', 'user', 'order_type', 'title', 'description',
            'requirements', 'status', 'quoted_price', 'invoice',
            'delivered_template', 'notes', 'created_at', 'updated_at'
        ]


class TemplateOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateOrder
        fields = ['order_type', 'title', 'description', 'requirements']


class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'amount', 'currency', 'payment_method',
            'mobile_network', 'phone_number', 'status', 'description',
            'created_at', 'updated_at'
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'plan', 'status', 'current_period_start',
            'current_period_end', 'created_at', 'updated_at'
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Create UserBillingPlan for new user (no plan selected yet)
        UserBillingPlan.objects.create(user=user)
        return user
