from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Website,
    Subscription,
    Payment,
    Invoice,
    InvoiceItem,
    BillingPlan,
    BillingPlanFeature,
    UserBillingPlan,
    Template,
    UserTemplate,
    TemplatePurchase,
    TemplateOrder,
    UserProfile,
    TeamMember,
    Domain,
    PageElement,
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "is_email_verified",
            "avatar",
            "phone",
            "bio",
            "date_of_birth",
            "email_notifications",
            "marketing_emails",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_email_verified", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "profile"]


class WebsiteSerializer(serializers.ModelSerializer):
    template_used_id = serializers.PrimaryKeyRelatedField(
        queryset=Template.objects.filter(is_active=True),
        source="template_used",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Website
        fields = [
            "id",
            "name",
            "slug",
            "content",
            "status",
            "is_published",
            "subdomain",
            "custom_domain",
            "template_used",
            "template_used_id",
            "settings",
            "seo_title",
            "seo_description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["owner", "created_at", "updated_at"]


# Billing Plan Serializers


class BillingPlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingPlanFeature
        fields = ["id", "feature_name", "feature_value", "is_included"]


class BillingPlanSerializer(serializers.ModelSerializer):
    features = BillingPlanFeatureSerializer(many=True, read_only=True)

    class Meta:
        model = BillingPlan
        fields = [
            "id",
            "name",
            "slug",
            "price",
            "billing_period",
            "description",
            "max_websites",
            "max_templates_access",
            "can_use_custom_domain",
            "can_remove_branding",
            "can_access_api",
            "can_have_team_members",
            "max_team_members",
            "has_priority_support",
            "has_analytics",
            "has_white_label",
            "can_order_custom_template",
            "is_active",
            "features",
            "created_at",
        ]


class UserBillingPlanSerializer(serializers.ModelSerializer):
    plan = BillingPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=BillingPlan.objects.filter(is_active=True),
        source="plan",
        write_only=True,
        required=False,
    )

    class Meta:
        model = UserBillingPlan
        fields = [
            "id",
            "user",
            "plan",
            "plan_id",
            "has_selected_plan",
            "selected_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "has_selected_plan", "selected_at"]


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
            "id",
            "name",
            "slug",
            "description",
            "category",
            "preview_image",
            "price",
            "is_free",
            "is_premium",
            "required_plan",
            "tags",
            "is_active",
            "created_at",
        ]


class TemplateDetailSerializer(serializers.ModelSerializer):
    """Detailed template serializer including template content"""

    class Meta:
        model = Template
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "preview_image",
            "template_file",
            "price",
            "is_free",
            "is_premium",
            "required_plan",
            "tags",
            "is_active",
            "created_at",
            "updated_at",
        ]


class UserTemplateSerializer(serializers.ModelSerializer):
    template = TemplateSerializer(read_only=True)

    class Meta:
        model = UserTemplate
        fields = [
            "id",
            "user",
            "template",
            "name",
            "content",
            "purchased_at",
            "website",
            "created_at",
        ]
        read_only_fields = ["user", "template", "purchased_at"]


class TemplatePurchaseSerializer(serializers.ModelSerializer):
    template = TemplateSerializer(read_only=True)
    user_template = UserTemplateSerializer(read_only=True)

    class Meta:
        model = TemplatePurchase
        fields = [
            "id",
            "user",
            "template",
            "user_template",
            "amount",
            "payment_status",
            "stripe_payment_id",
            "created_at",
        ]
        read_only_fields = ["user", "payment_status", "stripe_payment_id"]


# Invoice Serializers (must be before TemplateOrderSerializer)


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ["id", "description", "quantity", "unit_amount", "amount"]


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "user",
            "amount_due",
            "amount_paid",
            "currency",
            "status",
            "description",
            "due_date",
            "paid_at",
            "items",
            "invoice_pdf_url",
            "created_at",
            "updated_at",
        ]


class TemplateOrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    invoice = InvoiceSerializer(read_only=True)

    class Meta:
        model = TemplateOrder
        fields = [
            "id",
            "user",
            "order_type",
            "title",
            "description",
            "requirements",
            "status",
            "quoted_price",
            "invoice",
            "delivered_template",
            "notes",
            "created_at",
            "updated_at",
        ]


class TemplateOrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateOrder
        fields = ["order_type", "title", "description", "requirements"]


class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "amount",
            "currency",
            "payment_method",
            "mobile_network",
            "phone_number",
            "status",
            "description",
            "created_at",
            "updated_at",
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id",
            "user",
            "plan",
            "status",
            "current_period_start",
            "current_period_end",
            "created_at",
            "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Create UserBillingPlan for new user (no plan selected yet)
        UserBillingPlan.objects.create(user=user)
        # Create UserProfile for email verification
        UserProfile.objects.create(user=user)
        return user


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)


class SocialLoginSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["google", "facebook"])
    access_token = serializers.CharField()


class TeamMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    invited_by_name = serializers.CharField(
        source="invited_by.username", read_only=True, allow_null=True
    )

    class Meta:
        model = TeamMember
        fields = [
            "id",
            "website",
            "user",
            "username",
            "email",
            "role",
            "invited_by",
            "invited_by_name",
            "invited_at",
            "accepted_at",
            "is_active",
        ]


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = [
            "id",
            "website",
            "domain",
            "is_primary",
            "is_verified",
            "verification_code",
            "ssl_enabled",
            "created_at",
            "updated_at",
        ]


class PageElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageElement
        fields = [
            "id",
            "website",
            "page_name",
            "element_type",
            "element_data",
            "position",
            "parent",
            "is_visible",
            "created_at",
            "updated_at",
        ]
