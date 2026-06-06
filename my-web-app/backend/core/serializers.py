from rest_framework import serializers

from django.contrib.auth.models import User

from .models import (
    UserProfile,
    User,
    Website,
    BillingPlan,
    BillingPlanFeature,
    UserBillingPlan,
    Template,
    UserTemplate,
    TemplatePurchase,
    TemplateOrder,
    MediaImage,
    Domain,
    Page,
    PageElement,
    BlogPost,
    Category,
    Tag,
    FormSubmission,
    WebsiteAnalytics,
    WebsiteBackup,
    Product,
    ProductCategory,
    ProductOption,
    ProductVariant,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Coupon,
    ProductReview,
    Wishlist,
    SeoSettings,
    SitemapUrl,
    ExportedWebsite,
    Plugin,
    InstalledPlugin,
    Webhook,
    Automation,
    Form,
    FormField,
    TeamMember,
    Payment,
    Invoice,
    InvoiceItem,
    Subscription,
    PaymentMethod,
    CustomWebsiteUpload,
    WebsiteTemplateJSON,
    AIWebsiteGeneration,
    NewsletterSubscriber,
    EmailCampaign,
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "avatar",
            "phone",
            "bio",
            "date_of_birth",
            "email_notifications",
            "marketing_emails",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "profile"]

    def get_profile(self, obj):
        try:
            profile = obj.profile
            return UserProfileSerializer(profile).data
        except UserProfile.DoesNotExist:
            return None


class WebsiteSerializer(serializers.ModelSerializer):
    template_used_id = serializers.PrimaryKeyRelatedField(
        queryset=Template.objects.filter(is_active=True),
        source="template_used",
        write_only=True,
        required=False,
        allow_null=True,
    )
    page_elements = serializers.SerializerMethodField()

    def get_page_elements(self, obj):
        elements = obj.page_elements.all()[:6]
        return [
            {
                "element_type": e.element_type,
                "element_data": e.element_data,
            }
            for e in elements
        ]

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
            "is_scratch",
            "initial_content",
            "settings",
            "seo_title",
            "seo_description",
            "created_at",
            "updated_at",
            "page_elements",
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
            "hosting_type",
            "disk_space_gb",
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


class BillingPlanDetailSerializer(serializers.ModelSerializer):
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
            "hosting_type",
            "disk_space_gb",
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
            "updated_at",
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
            "stripe_payment_intent_id",
            "created_at",
        ]
        read_only_fields = [
            "user",
            "payment_status",
            "stripe_payment_id",
            "stripe_payment_intent_id",
        ]


# Invoice Serializers


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
            "stripe_invoice_id",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "subscription",
            "amount",
            "currency",
            "payment_method",
            "mobile_network",
            "phone_number",
            "status",
            "description",
            "created_at",
            "updated_at",
            "stripe_payment_intent_id",
            "stripe_charge_id",
        ]


# Payment Method Serializer
class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            "id",
            "user",
            "provider",
            "type",
            "is_default",
            "masked_number",
            "phone_number",
            "expiry_month",
            "expiry_year",
            "card_holder_name",
            "status",
            "created_at",
        ]
        read_only_fields = ["user", "masked_number", "created_at"]


# Subscription Serializer


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
            "stripe_customer_id",
            "stripe_subscription_id",
        ]


# Password reset / auth serializers used by core.views


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    recaptcha_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "recaptcha_token"]

    def create(self, validated_data):
        validated_data.pop("recaptcha_token", None)
        user = User.objects.create_user(**validated_data)
        UserBillingPlan.objects.create(user=user)
        UserProfile.objects.create(user=user)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    recaptcha_token = serializers.CharField(write_only=True, required=False, allow_blank=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    recaptcha_token = serializers.CharField(write_only=True, required=False, allow_blank=True)


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


# Custom Website Upload Serializers


class CustomWebsiteUploadSerializer(serializers.ModelSerializer):
    index_file_path = serializers.SerializerMethodField()

    def get_index_file_path(self, obj):
        index_path = obj.get_index_file_path()
        if index_path:
            from django.conf import settings

            if index_path.startswith(settings.MEDIA_ROOT):
                rel_path = index_path[len(settings.MEDIA_ROOT) :]
                if rel_path.startswith("/") or rel_path.startswith("\\"):
                    rel_path = rel_path[1:]
            else:
                rel_path = index_path
            return rel_path.replace("\\", "/")
        return None

    class Meta:
        model = CustomWebsiteUpload
        fields = [
            "id",
            "name",
            "slug",
            "zip_file",
            "extracted_path",
            "index_file_path",
            "source",
            "status",
            "error_message",
            "file_size",
            "is_published",
            "published_at",
            "custom_domain",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "owner",
            "extracted_path",
            "status",
            "error_message",
            "created_at",
            "updated_at",
        ]


class CustomWebsiteUploadCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    zip_file = serializers.FileField()


class WebsiteTemplateJSONSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteTemplateJSON
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "json_structure",
            "source_html",
            "thumbnail",
            "is_active",
            "created_from_upload",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


# AI Website Generation Serializers


class AIWebsiteGenerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIWebsiteGeneration
        fields = [
            "id",
            "prompt",
            "website",
            "generated_content",
            "status",
            "error_message",
            "created_at",
            "completed_at",
        ]


class AIWebsiteGenerateSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=True)


# Blog/CMS


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]


class BlogPostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), write_only=True, required=False
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "author",
            "website",
            "title",
            "slug",
            "excerpt",
            "content",
            "featured_image",
            "status",
            "is_featured",
            "published_at",
            "categories",
            "category_ids",
            "tags",
            "tag_ids",
            "meta_title",
            "meta_description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]

    def create(self, validated_data):
        categories = validated_data.pop("category_ids", [])
        tags = validated_data.pop("tag_ids", [])
        blog_post = BlogPost.objects.create(**validated_data)
        if categories:
            blog_post.categories.set(categories)
        if tags:
            blog_post.tags.set(tags)
        return blog_post

    def update(self, instance, validated_data):
        categories = validated_data.pop("category_ids", None)
        tags = validated_data.pop("tag_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        if tags is not None:
            instance.tags.set(tags)
        return instance


# Basic SEO serializers


class SeoSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeoSettings
        fields = [
            "id",
            "website",
            "google_analytics_id",
            "google_tag_manager_id",
            "google_search_console_id",
            "bing_webmaster_id",
            "default_og_image",
            "robots_txt",
            "sitemap_frequency",
            "created_at",
            "updated_at",
        ]


class SitemapUrlSerializer(serializers.ModelSerializer):
    class Meta:
        model = SitemapUrl
        fields = [
            "id",
            "website",
            "loc",
            "lastmod",
            "changefreq",
            "priority",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]


# Export


class ExportedWebsiteSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    def get_download_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    class Meta:
        model = ExportedWebsite
        fields = [
            "id",
            "website",
            "export_type",
            "status",
            "file",
            "download_url",
            "file_size",
            "download_count",
            "created_at",
            "completed_at",
        ]
        read_only_fields = [
            "status",
            "file",
            "file_size",
            "download_count",
            "created_at",
            "completed_at",
        ]


# Plugins


class PluginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plugin
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "version",
            "author",
            "website_url",
            "icon",
            "settings_schema",
            "default_settings",
            "required_plan",
            "is_builtin",
            "is_active",
            "created_at",
            "updated_at",
        ]


class InstalledPluginSerializer(serializers.ModelSerializer):
    plugin = PluginSerializer(read_only=True)
    plugin_id = serializers.PrimaryKeyRelatedField(
        queryset=Plugin.objects.all(), source="plugin", write_only=True
    )

    class Meta:
        model = InstalledPlugin
        fields = [
            "id",
            "website",
            "plugin",
            "plugin_id",
            "settings",
            "is_enabled",
            "installed_at",
            "updated_at",
        ]
        read_only_fields = ["installed_at", "updated_at"]


# Automation / Webhooks


class WebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webhook
        fields = [
            "id",
            "website",
            "name",
            "url",
            "method",
            "headers",
            "events",
            "is_active",
            "last_triggered",
            "failure_count",
            "created_at",
        ]
        read_only_fields = ["last_triggered", "failure_count", "created_at"]


class AutomationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Automation
        fields = [
            "id",
            "website",
            "name",
            "description",
            "trigger",
            "trigger_conditions",
            "action",
            "action_data",
            "is_active",
            "last_triggered",
            "run_count",
            "created_at",
        ]
        read_only_fields = ["last_triggered", "run_count", "created_at"]


# Newsletter


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = [
            "id",
            "email",
            "website",
            "is_active",
            "subscribed_at",
            "unsubscribed_at",
            "source",
        ]
        read_only_fields = ["subscribed_at", "unsubscribed_at"]


class EmailCampaignSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = EmailCampaign
        fields = [
            "id",
            "website",
            "name",
            "subject",
            "body",
            "plain_text",
            "from_name",
            "from_email",
            "reply_to",
            "recipient_list",
            "include_subscribers",
            "include_customers",
            "scheduled_at",
            "sent_at",
            "total_recipients",
            "delivered_count",
            "opened_count",
            "clicked_count",
            "bounced_count",
            "status",
            "error_message",
            "created_at",
            "created_by",
        ]
        read_only_fields = [
            "total_recipients",
            "delivered_count",
            "opened_count",
            "clicked_count",
            "bounced_count",
            "status",
            "error_message",
            "sent_at",
            "created_at",
            "created_by",
        ]


# Forms


class FormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = [
            "id",
            "website",
            "name",
            "slug",
            "description",
            "fields",
            "submit_text",
            "success_message",
            "email_notifications",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = [
            "id",
            "form",
            "name",
            "label",
            "field_type",
            "is_required",
            "placeholder",
            "default_value",
            "choices",
            "validation",
            "help_text",
            "sort_order",
        ]
        read_only_fields = ["sort_order"]


class FormSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormSubmission
        fields = [
            "id",
            "website",
            "form_name",
            "submission_data",
            "submitted_at",
            "ip_address",
        ]
        read_only_fields = ["submitted_at", "ip_address"]


class WebsiteAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteAnalytics
        fields = [
            "id",
            "date",
            "visitors",
            "page_views",
            "bounce_rate",
            "device_type",
        ]


class WebsiteBackupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = WebsiteBackup
        fields = [
            "id",
            "website",
            "name",
            "file_size",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["created_by", "created_at"]




# Page


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = [
            "id",
            "website",
            "name",
            "slug",
            "title",
            "meta_description",
            "is_homepage",
            "is_published",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


# E-commerce


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = [
            "id",
            "website",
            "name",
            "slug",
            "description",
            "image",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["slug", "created_at"]


class ProductOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOption
        fields = ["id", "product", "name", "values", "is_required"]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product",
            "sku",
            "options",
            "price",
            "sale_price",
            "quantity",
            "image",
        ]


class ProductSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
    )
    options = ProductOptionSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "website",
            "name",
            "slug",
            "description",
            "short_description",
            "price",
            "sale_price",
            "cost",
            "sku",
            "barcode",
            "track_inventory",
            "quantity",
            "low_stock_threshold",
            "in_stock",
            "images",
            "featured_image",
            "category",
            "category_id",
            "tags",
            "is_active",
            "is_featured",
            "requires_shipping",
            "weight",
            "dimensions",
            "meta_title",
            "meta_description",
            "options",
            "variants",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug", "in_stock", "created_at", "updated_at"]


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )
    variant = ProductVariantSerializer(read_only=True)
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(),
        source="variant",
        write_only=True,
        required=False,
        allow_null=True,
    )
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "cart",
            "product",
            "product_id",
            "variant",
            "variant_id",
            "quantity",
            "unit_price",
            "total_price",
            "added_at",
        ]
        read_only_fields = ["unit_price", "total_price", "added_at"]


class CartUpdateSerializer(serializers.Serializer):
    cart_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)


class CheckoutSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    shipping_address_line1 = serializers.CharField(max_length=200, required=False, allow_blank=True)
    shipping_address_line2 = serializers.CharField(max_length=200, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100, required=False, allow_blank=True)

    shipping_country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    billing_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    billing_address_line1 = serializers.CharField(max_length=200, required=False, allow_blank=True)
    billing_address_line2 = serializers.CharField(max_length=200, required=False, allow_blank=True)
    billing_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    billing_state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    billing_country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    billing_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    same_as_shipping = serializers.BooleanField(default=True, required=False)
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    shipping_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0, default=0)
    payment_method = serializers.ChoiceField(choices=["stripe", "flutterwave", "mobile_money", "paypal"], required=False, default="stripe")
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class OrderTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)


    class Meta:
        model = Cart
        fields = [
            "id",
            "user",
            "session_id",
            "website",
            "is_active",
            "items",
            "total_items",
            "subtotal",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "session_id", "is_active", "created_at", "updated_at"]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "variant",
            "product_name",
            "variant_name",
            "unit_price",
            "quantity",
            "total_price",
        ]
        read_only_fields = ["total_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "website",
            "user",
            "email",
            "phone",
            "shipping_name",
            "shipping_address_line1",
            "shipping_address_line2",
            "shipping_city",
            "shipping_state",
            "shipping_country",
            "shipping_postal_code",
            "billing_name",
            "billing_address_line1",
            "billing_address_line2",
            "billing_city",
            "billing_state",
            "billing_country",
            "billing_postal_code",
            "same_as_shipping",
            "items",
            "subtotal",
            "tax_amount",
            "shipping_cost",
            "discount_amount",
            "total",
            "payment",
            "payment_status",
            "payment_method",
            "payment_intent_id",
            "status",
            "notes",
            "tracking_number",
            "tracking_url",
            "shipped_at",
            "delivered_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["order_number", "status", "payment_status", "created_at", "updated_at"]


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            "id",
            "website",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "minimum_amount",
            "maximum_discount",
            "usage_limit",
            "used_count",
            "per_customer_limit",
            "valid_from",
            "valid_until",
            "is_active",
            "is_valid",
            "created_at",
        ]
        read_only_fields = ["used_count", "is_valid", "created_at"]


class ProductReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "product",
            "user",
            "rating",
            "title",
            "comment",
            "is_verified_purchase",
            "is_approved",
            "helpful_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "is_verified_purchase",
            "is_approved",
            "helpful_count",
            "created_at",
            "updated_at",
        ]


class WishlistSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    product_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Product.objects.all(), source="products", write_only=True
    )

    class Meta:
        model = Wishlist
        fields = ["id", "user", "website", "products", "product_ids", "created_at"]
        read_only_fields = ["user", "created_at"]


# Orders / template order


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


OrderCreateSerializer = TemplateOrderCreateSerializer


class TemplatePurchaseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplatePurchase
        fields = ["template", "amount", "payment_status"]


