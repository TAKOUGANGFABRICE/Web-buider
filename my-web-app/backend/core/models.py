from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.timezone import timedelta
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import uuid
import os

def generate_transaction_id():
    return f"txn_{uuid.uuid4().hex[:16]}"

# Import models from advanced_auth so Django can see them for migrations
from .advanced_auth import (
    LoginHistory,
    FailedLoginAttempt,
    UserSession,
    TwoFactorAuth,
    MagicLoginToken,
    LoginAttemptLockout,
)


# ============================================
# AUTHENTICATION MODULE
# ============================================


class UserProfile(models.Model):
    """Extended user profile for social login"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    is_email_verified = models.BooleanField(default=False)
    password_reset_token = models.CharField(max_length=255, blank=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)

    # Social login fields
    google_id = models.CharField(max_length=255, blank=True, null=True)
    facebook_id = models.CharField(max_length=255, blank=True, null=True)

    # Additional profile fields
    avatar = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True, max_length=500)
    date_of_birth = models.DateField(null=True, blank=True)

    # Preferences
    email_notifications = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["password_reset_token"]),
        ]

    def __str__(self):
        return f"Profile of {self.user.username}"

    def generate_password_reset_token(self):
        import secrets

        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires = timezone.now() + timedelta(hours=24)
        return self.password_reset_token

    def is_password_reset_valid(self):
        if not self.password_reset_token or not self.password_reset_expires:
            return False
        return timezone.now() < self.password_reset_expires


# ============================================
# BILLING MODULE
# ============================================


class BillingPlan(models.Model):
    """Define available billing plans with their features"""

    BILLING_PERIOD_CHOICES = [
        ("monthly", "Monthly"),
        ("yearly", "Yearly"),
    ]

    HOSTING_TYPE_CHOICES = [
        ("shared", "Shared Hosting"),
        ("vps", "VPS Hosting"),
        ("dedicated", "Dedicated Server"),
        ("cloud", "Cloud Hosting"),
    ]

    name = models.CharField(
        max_length=50, help_text="Plan name (e.g., Basic, Pro, Enterprise)"
    )
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Price in USD",
    )
    billing_period = models.CharField(
        max_length=20, choices=BILLING_PERIOD_CHOICES, default="monthly"
    )
    description = models.TextField(blank=True, help_text="Plan description")

    # Hosting & Storage
    hosting_type = models.CharField(
        max_length=20,
        choices=HOSTING_TYPE_CHOICES,
        default="shared",
        help_text="Type of hosting for this plan",
    )
    disk_space_gb = models.IntegerField(
        default=5,
        validators=[MinValueValidator(1)],
        help_text="Disk space in GB (-1 for unlimited)",
    )

    # Website & Template Limits
    max_websites = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Maximum number of websites allowed (-1 for unlimited)",
    )
    max_templates_access = models.IntegerField(
        default=0, help_text="Templates access (0=none, -1=all)"
    )

    # Feature Flags
    can_use_custom_domain = models.BooleanField(default=False)
    can_remove_branding = models.BooleanField(default=False)
    can_access_api = models.BooleanField(default=False)
    can_have_team_members = models.BooleanField(default=False)
    max_team_members = models.IntegerField(default=0)
    has_priority_support = models.BooleanField(default=False)
    has_analytics = models.BooleanField(default=False)
    has_white_label = models.BooleanField(default=False)
    can_order_custom_template = models.BooleanField(default=False)

    # Stripe Integration
    is_active = models.BooleanField(default=True)
    stripe_price_id = models.CharField(max_length=255, blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["price"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["price"]),
            models.Index(fields=["is_active", "price"]),
        ]

    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_period}"

    def get_feature_list(self):
        """Return a list of enabled features"""
        features = []
        if self.can_use_custom_domain:
            features.append("Custom Domain")
        if self.can_remove_branding:
            features.append("Remove Branding")
        if self.can_access_api:
            features.append("API Access")
        if self.can_have_team_members:
            features.append(f"Team Members ({self.max_team_members})")
        if self.has_priority_support:
            features.append("Priority Support")
        if self.has_analytics:
            features.append("Analytics")
        if self.has_white_label:
            features.append("White Label")
        if self.can_order_custom_template:
            features.append("Custom Templates")
        return features


class BillingPlanFeature(models.Model):
    """Detailed features for each billing plan"""

    plan = models.ForeignKey(
        BillingPlan, on_delete=models.CASCADE, related_name="features"
    )
    feature_name = models.CharField(max_length=100)
    feature_value = models.CharField(max_length=255)
    is_included = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["plan", "feature_name"]),
        ]

    def __str__(self):
        return f"{self.plan.name} - {self.feature_name}"


class UserBillingPlan(models.Model):
    """Track which billing plan a user has selected (required after signup)"""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="billing_plan"
    )
    plan = models.ForeignKey(
        BillingPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subscribers",
    )
    has_selected_plan = models.BooleanField(default=False)
    selected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["plan"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.plan.name if self.plan else 'No Plan'}"


# ============================================
# SUBSCRIPTION MODULE
# ============================================


class Subscription(models.Model):
    PLAN_CHOICES = [
        ("free", "Free"),
        ("starter", "Starter"),
        ("pro", "Pro"),
        ("business", "Business"),
        ("enterprise", "Enterprise"),
        ("premium", "Premium"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("cancelled", "Cancelled"),
        ("past_due", "Past Due"),
        ("unpaid", "Unpaid"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan}"


# ============================================
# WEBSITE MODULE
# ============================================


class Website(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="websites")
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, blank=True)
    content = models.TextField(blank=True, help_text="Main website content/HTML")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    subdomain = models.CharField(max_length=100, blank=True, null=True)
    custom_domain = models.CharField(max_length=255, blank=True, null=True)
    template_used = models.ForeignKey(
        "Template",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="websites_created",
    )
    is_scratch = models.BooleanField(
        default=False,
        help_text="Whether website was created from scratch (no template)",
    )
    initial_content = models.TextField(
        blank=True,
        help_text="Initial HTML content for scratch websites",
    )
    settings = models.JSONField(default=dict, blank=True)
    seo_title = models.CharField(max_length=200, blank=True)
    seo_description = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "-created_at"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["is_published"]),
            models.Index(fields=["subdomain"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        from django.utils.text import slugify

        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ============================================
# TEAM MEMBER MODULE
# ============================================


class TeamMember(models.Model):
    """Team collaboration on websites"""

    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("editor", "Editor"),
        ("viewer", "Viewer"),
    ]

    website = models.ForeignKey(
        "Website", on_delete=models.CASCADE, related_name="team_members"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="team_memberships"
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="editor")
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invitations",
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["website", "user"]
        indexes = [
            models.Index(fields=["website"]),
            models.Index(fields=["user"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.website.name} ({self.role})"

    def is_owner(self):
        return self.role == "owner"

    def can_edit(self):
        return self.role in ["owner", "admin", "editor"]


# ============================================
# MEDIA GALLERY MODULE
# ============================================


class MediaImage(models.Model):
    """User uploaded images for gallery"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="uploaded_images"
    )
    name = models.CharField(max_length=255)
    image = models.ImageField(upload_to="user_images/%Y/%m/")
    image_url = models.URLField(blank=True, null=True)
    file_size = models.IntegerField(default=0, help_text="Size in bytes")
    width = models.IntegerField(default=0)
    height = models.IntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.image and not self.file_size:
            self.file_size = self.image.size
        super().save(*args, **kwargs)


# ============================================
# CUSTOM DOMAIN MODULE
# ============================================


class Domain(models.Model):
    """Custom domains for websites"""

    website = models.ForeignKey(
        "Website", on_delete=models.CASCADE, related_name="domains"
    )
    domain = models.CharField(max_length=255, unique=True)
    is_primary = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=100, blank=True)
    verification_record = models.CharField(max_length=100, blank=True)
    ssl_enabled = models.BooleanField(default=False)
    ssl_cert_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["website"]),
            models.Index(fields=["domain"]),
            models.Index(fields=["is_verified"]),
        ]

    def __str__(self):
        return f"{self.domain} -> {self.website.name}"


# ============================================
# PAGE ELEMENT MODULE
# ============================================


class PageElement(models.Model):
    """Page builder elements for websites"""

    ELEMENT_TYPE_CHOICES = [
        ("text", "Text Block"),
        ("heading", "Heading"),
        ("image", "Image"),
        ("button", "Button"),
        ("container", "Container"),
        ("row", "Row"),
        ("column", "Column"),
        ("nav", "Navigation"),
        ("footer", "Footer"),
        ("hero", "Hero Section"),
        ("gallery", "Gallery"),
        ("form", "Form"),
        ("video", "Video"),
        ("map", "Map"),
        ("social", "Social Links"),
        ("divider", "Divider"),
        ("spacer", "Spacer"),
    ]

    website = models.ForeignKey(
        "Website", on_delete=models.CASCADE, related_name="page_elements"
    )
    page_name = models.CharField(
        max_length=100,
        default="index",
        help_text="Page identifier (e.g., index, about, contact)",
    )
    element_type = models.CharField(max_length=50, choices=ELEMENT_TYPE_CHOICES)
    element_data = models.JSONField(
        default=dict, help_text="Element properties (style, content, attributes)"
    )
    position = models.IntegerField(default=0)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["page_name", "position"]
        indexes = [
            models.Index(fields=["website", "page_name"]),
            models.Index(fields=["page_name"]),
        ]

    def __str__(self):
        return f"{self.get_element_type_display()} on {self.website.name} - {self.page_name}"


# Template System Models

# ============================================
# TEMPLATE MODULE
# ============================================


class Template(models.Model):
    """Website templates available for purchase"""

    TEMPLATE_CATEGORY_CHOICES = [
        ("portfolio", "Portfolio"),
        ("business", "Business"),
        ("ecommerce", "E-Commerce"),
        ("blog", "Blog"),
        ("landing", "Landing Page"),
        ("restaurant", "Restaurant"),
        ("real_estate", "Real Estate"),
        ("education", "Education"),
        ("nonprofit", "Non-Profit"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=TEMPLATE_CATEGORY_CHOICES)
    preview_image = models.URLField(blank=True)
    template_file = models.TextField()  # HTML/CSS/JS content
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_free = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    required_plan = models.ForeignKey(
        BillingPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="included_templates",
    )
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    download_count = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["price", "is_free"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["-rating"]),
        ]

    def __str__(self):
        return self.name

    def get_tags_list(self):
        """Return tags as a list"""
        if isinstance(self.tags, list):
            return self.tags
        return []


class UserTemplate(models.Model):
    """User's purchased/copied template - only they can customize it"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_templates"
    )
    template = models.ForeignKey(
        Template, on_delete=models.CASCADE, related_name="user_copies"
    )
    name = models.CharField(max_length=100)
    content = models.TextField()
    purchased_at = models.DateTimeField(auto_now_add=True)
    website = models.OneToOneField(
        "Website",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="source_template",
    )

    class Meta:
        ordering = ["-purchased_at"]
        indexes = [
            models.Index(fields=["user", "-purchased_at"]),
            models.Index(fields=["template"]),
        ]

    def __str__(self):
        return f"{self.user.username}'s copy of {self.template.name}"


class TemplatePurchase(models.Model):
    """Record of template purchases"""

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="template_purchases"
    )
    template = models.ForeignKey(
        Template, on_delete=models.CASCADE, related_name="purchases"
    )
    user_template = models.OneToOneField(
        UserTemplate,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="purchase",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )
    stripe_payment_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["template"]),
            models.Index(fields=["payment_status"]),
        ]

    def __str__(self):
        return f"{self.user.username} purchased {self.template.name}"


class TemplateOrder(models.Model):
    """Custom template orders that generate invoices"""

    ORDER_TYPE_CHOICES = [
        ("custom_design", "Custom Design"),
        ("template_customization", "Template Customization"),
        ("modification", "Modification Request"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("quoted", "Quoted"),
        ("approved", "Approved"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="template_orders"
    )
    order_type = models.CharField(max_length=50, choices=ORDER_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    quoted_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    invoice = models.OneToOneField(
        "Invoice",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="template_order",
    )
    delivered_template = models.ForeignKey(
        Template,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["order_type"]),
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.title}"


class Payment(models.Model):
    """All payment records including subscriptions and template purchases"""

    PAYMENT_METHOD_CHOICES = [
        ("card", "Credit Card"),
        ("mobile_money", "Mobile Money"),
        ("bank_transfer", "Bank Transfer"),
        ("paypal", "PayPal"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
        ("cancelled", "Cancelled"),
    ]

    MOBILE_NETWORK_CHOICES = [
        ("orange", "Orange Money"),
        ("mtn", "MTN Mobile Money"),
        ("vodafone", "Vodafone Cash"),
        ("airteltigo", "AirtelTigo Money"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    transaction_id = models.CharField(max_length=100, unique=True, blank=True, null=True, help_text="Unique transaction ID for the payment")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    mobile_network = models.CharField(
        max_length=20, choices=MOBILE_NETWORK_CHOICES, blank=True, null=True
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["subscription"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["stripe_payment_intent_id"]),
            models.Index(fields=["transaction_id"]),
        ]

    def __str__(self):
        return f"Payment {self.transaction_id or self.id} - {self.amount} {self.currency}"

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = generate_transaction_id()
        super().save(*args, **kwargs)


class Invoice(models.Model):
    """Billing invoices for users"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("paid", "Paid"),
        ("void", "Void"),
        ("uncollectible", "Uncollectible"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invoices")
    payment = models.OneToOneField(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice",
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    stripe_invoice_id = models.CharField(max_length=255, blank=True, null=True)
    invoice_pdf_url = models.URLField(blank=True, null=True)
    billing_name = models.CharField(max_length=200, blank=True)
    billing_address = models.TextField(blank=True)
    billing_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username}"

    @property
    def is_paid(self):
        return self.status == "paid"

    @property
    def balance(self):
        return self.amount_due - self.amount_paid


class InvoiceItem(models.Model):
    """Line items on invoices"""

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    unit_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=["invoice"]),
        ]

    def __str__(self):
        return f"{self.description} - {self.amount}"

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_amount
        super().save(*args, **kwargs)


class PaymentMethod(models.Model):
    """Stored payment methods for users (tokenized, never stores raw card data)"""

    PROVIDER_CHOICES = [
        ("mtn", "MTN Mobile Money"),
        ("orange", "Orange Money"),
        ("visa", "Visa"),
        ("mastercard", "MasterCard"),
        ("flutterwave_voucher", "Flutterwave Virtual Card"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_methods")
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    type = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    is_default = models.BooleanField(default=False)
    flutterwave_token = models.CharField(max_length=255, blank=True, null=True, help_text="Flutterwave payment token")
    masked_number = models.CharField(max_length=50, blank=True, help_text="Masked account/card number")
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="For mobile money")
    expiry_month = models.CharField(max_length=2, blank=True)
    expiry_year = models.CharField(max_length=4, blank=True)
    card_holder_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, default="active", help_text="active, expired, removed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-is_default"]),
            models.Index(fields=["provider"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self):
        return f"{self.get_provider_display()} - {self.masked_number or self.phone_number}"

    def save(self, *args, **kwargs):
        if self.is_default:
            PaymentMethod.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


# ============================================
# CUSTOM WEBSITE UPLOAD MODULE
# ============================================


class CustomWebsiteUpload(models.Model):
    """Stores ZIP file uploads for custom websites"""

    SOURCE_CHOICES = [
        ("upload", "User Upload"),
        ("template_convert", "Template Conversion"),
    ]

    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="custom_uploads"
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, blank=True)
    zip_file = models.FileField(
        upload_to="uploads/websites/%Y/%m/", help_text="Uploaded ZIP file"
    )
    extracted_path = models.CharField(
        max_length=500, blank=True, help_text="Path to extracted files"
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="upload")
    status = models.CharField(
        max_length=20, default="pending", help_text="pending, extracting, ready, failed"
    )
    error_message = models.TextField(blank=True)
    file_size = models.IntegerField(default=0, help_text="Size in bytes")
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    custom_domain = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "-created_at"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        from django.utils.text import slugify

        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def get_extracted_directory(self):
        """Return the full path to extracted directory"""
        if self.extracted_path:
            from django.conf import settings

            return os.path.join(settings.MEDIA_ROOT, self.extracted_path)
        return None

    def get_index_file_path(self):
        """Find the main HTML file in extracted content"""
        extracted_dir = self.get_extracted_directory
        if not extracted_dir or not os.path.exists(extracted_dir):
            return None

        # Common index file names
        index_names = ["index.html", "index.htm", "home.html", "home.htm"]

        for root, dirs, files in os.walk(extracted_dir):
            for filename in files:
                if filename.lower() in index_names:
                    return os.path.join(root, filename)

        # If no index file found, return first HTML file
        for root, dirs, files in os.walk(extracted_dir):
            for filename in files:
                if filename.endswith(".html") or filename.endswith(".htm"):
                    return os.path.join(root, filename)

        return None


class WebsiteTemplateJSON(models.Model):
    """JSON structure converted from HTML/ZIP for use in builder"""

    TEMPLATE_TYPE_CHOICES = [
        ("zip_converted", "ZIP Converted"),
        ("builder_created", "Builder Created"),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    json_structure = models.JSONField(help_text="JSON structure for page builder")
    source_html = models.TextField(blank=True, help_text="Original HTML content")
    thumbnail = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_from_upload = models.ForeignKey(
        CustomWebsiteUpload,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="converted_templates",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


# ============================================
# AI WEBSITE GENERATION MODULE
# ============================================


class AIWebsiteGeneration(models.Model):
    """Track AI website generation requests and results"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="ai_generations"
    )
    prompt = models.TextField(help_text="User's text prompt for website generation")
    website = models.OneToOneField(
        "Website",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="ai_generation",
    )
    generated_content = models.JSONField(
        default=dict, help_text="Generated website elements JSON"
    )
    status = models.CharField(
        max_length=20,
        default="pending",
        choices=[
            ("pending", "Pending"),
            ("processing", "Processing"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
    )
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"AI Generation for {self.user.username}: {self.prompt[:50]}..."


# ============================================
# BLOG / CMS MODULE
# ============================================


class BlogPost(models.Model):
    """Blog posts for CMS functionality"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blog_posts"
    )
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="blog_posts",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    excerpt = models.TextField(blank=True, help_text="Short description of the post")
    content = models.TextField(help_text="Full post content (HTML supported)")
    featured_image = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    is_featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    categories = models.ManyToManyField(
        "Category", blank=True, related_name="posts"
    )
    tags = models.ManyToManyField("Tag", blank=True, related_name="posts")
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["status"]),
            models.Index(fields=["-published_at"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        from django.utils.text import slugify
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class Category(models.Model):
    """Blog categories"""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Blog tags"""

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    def __str__(self):
        return self.name


# ============================================
# FORMS & CONTACT MODULE
# ============================================


class FormSubmission(models.Model):
    """Store form submissions from websites"""

    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="form_submissions",
    )
    form_name = models.CharField(max_length=100, help_text="Name/identifier of the form")
    submission_data = models.JSONField(help_text="Submitted form data")
    submitted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["website", "-submitted_at"]),
        ]

    def __str__(self):
        return f"Form '{self.form_name}' submission on {self.website.name}"


# ============================================
# ANALYTICS MODULE
# ============================================


class WebsiteAnalytics(models.Model):
    """Store analytics data for websites"""

    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="analytics",
    )
    date = models.DateField()
    visitors = models.IntegerField(default=0)
    page_views = models.IntegerField(default=0)
    bounce_rate = models.FloatField(default=0)
    device_type = models.CharField(
        max_length=20,
        choices=[
            ("desktop", "Desktop"),
            ("mobile", "Mobile"),
            ("tablet", "Tablet"),
        ],
        default="desktop",
    )

    class Meta:
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["website", "-date"]),
        ]

    def __str__(self):
        return f"Analytics for {self.website.name} on {self.date}"


# ============================================
# BACKUP MODULE
# ============================================


class WebsiteBackup(models.Model):
    """Store website backup snapshots"""

    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="backups",
    )
    name = models.CharField(max_length=100)
    backup_data = models.JSONField(help_text="Backup of website elements and settings")
    file_size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="website_backups"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["website", "-created_at"]),
        ]

    def __str__(self):
        return f"Backup '{self.name}' for {self.website.name}"


# ============================================
# PAGE MODULE (Multi-page support)
# ============================================


class Page(models.Model):
    """Individual pages for a website"""

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="pages"
    )
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    name = models.CharField(max_length=100, help_text="Page display name")
    slug = models.SlugField(max_length=100, help_text="URL-friendly identifier")
    route = models.CharField(
        max_length=200, blank=True, default="", help_text="Custom route path"
    )
    title = models.CharField(max_length=200, help_text="Page title (for browser tab)")
    meta_description = models.TextField(
        max_length=500, blank=True, help_text="SEO meta description"
    )
    is_homepage = models.BooleanField(default=False, help_text="Is this the homepage?")
    is_published = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0, help_text="Order in navigation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["website", "sort_order"]),
            models.Index(fields=["slug"]),
        ]
        unique_together = ["website", "slug"]

    def __str__(self):
        return f"{self.website.name} - {self.name}"

    def save(self, *args, **kwargs):
        from django.utils.text import slugify

        if not self.slug:
            self.slug = slugify(self.name)
        if self.is_homepage:
            self.slug = ""
            self.route = ""
        super().save(*args, **kwargs)


# ============================================
# E-COMMERCE MODULE
# ============================================


class ProductCategory(models.Model):
    """Categories for organizing products"""

    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="product_categories",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["website"]),
            models.Index(fields=["slug"]),
        ]
        unique_together = ["website", "slug"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        from django.utils.text import slugify

        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """Products for e-commerce websites"""

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="products"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    description = models.TextField(blank=True)
    short_description = models.TextField(
        max_length=500, blank=True, help_text="Brief summary"
    )

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, help_text="Cost price"
    )

    # Inventory
    sku = models.CharField(max_length=100, blank=True, unique=True, null=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    track_inventory = models.BooleanField(default=True)
    quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)

    # Media
    images = models.JSONField(
        default=list, blank=True, help_text="List of image URLs"
    )
    featured_image = models.URLField(blank=True, null=True)

    # Organization
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    tags = models.JSONField(default=list, blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    requires_shipping = models.BooleanField(default=True)
    weight = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True, help_text="Weight in kg"
    )
    dimensions = models.JSONField(
        default=dict, blank=True, help_text="Length, width, height"
    )

    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["website", "-created_at"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "is_featured"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        from django.utils.text import slugify

        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def current_price(self):
        return self.sale_price if self.sale_price else self.price

    @property
    def in_stock(self):
        return self.quantity > 0 if self.track_inventory else True


class ProductOption(models.Model):
    """Product variants (size, color, etc.)"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="options"
    )
    name = models.CharField(max_length=100, help_text="Option name (e.g., Size, Color)")
    values = models.JSONField(
        default=list, help_text="List of option values (e.g., ['S', 'M', 'L'])"
    )
    is_required = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class ProductVariant(models.Model):
    """Specific product variant with unique SKU and pricing"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    sku = models.CharField(max_length=100, unique=True)
    options = models.JSONField(
        default=dict, help_text='e.g., {"Size": "M", "Color": "Red"}'
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    sale_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    quantity = models.IntegerField(default=0)
    image = models.URLField(blank=True, null=True)

    def __str__(self):
        options_str = " / ".join([f"{k}: {v}" for k, v in self.options.items()])
        return f"{self.product.name} - {options_str}"

    @property
    def current_price(self):
        price = self.sale_price if self.sale_price else self.price
        if price is None:
            return self.product.current_price
        return price


class Cart(models.Model):
    """Shopping cart for a user/guest"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="carts",
        null=True,
        blank=True,
        help_text="Authenticated user (null for guest carts)",
    )
    session_id = models.CharField(
        max_length=100, blank=True, null=True, help_text="For guest users"
    )
    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="carts"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["session_id", "is_active"]),
            models.Index(fields=["website"]),
        ]

    def __str__(self):
        if self.user:
            return f"Cart for {self.user.username}"
        return f"Guest Cart ({self.session_id})"

    @property
    def total_items(self):
        return self.items.aggregate(total=models.Sum("quantity"))["total"] or 0

    @property
    def subtotal(self):
        total = 0
        for item in self.items.all():
            variant_price = item.variant.current_price if item.variant else item.product.current_price
            total += variant_price * item.quantity
        return total


class CartItem(models.Model):
    """Individual item in a cart"""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.SET_NULL, null=True, blank=True
    )
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["cart", "product", "variant"]
        indexes = [
            models.Index(fields=["cart"]),
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        variant_str = f" - {self.variant}" if self.variant else ""
        return f"{self.product.name}{variant_str} x {self.quantity}"

    @property
    def unit_price(self):
        if self.variant:
            price = self.variant.current_price
        else:
            price = self.product.current_price
        return price or self.product.price

    @property
    def total_price(self):
        return self.unit_price * self.quantity


class Order(models.Model):
    """Customer orders"""

    ORDER_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
        ("partial_refund", "Partially Refunded"),
    ]

    order_number = models.CharField(max_length=50, unique=True)
    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="orders"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        help_text="Registered user (null for guest checkout)",
    )
    email = models.EmailField(help_text="Customer email")
    phone = models.CharField(max_length=20, blank=True, null=True)

    # Shipping address
    shipping_name = models.CharField(max_length=200)
    shipping_address_line1 = models.CharField(max_length=200)
    shipping_address_line2 = models.CharField(max_length=200, blank=True, null=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100, blank=True, null=True)
    shipping_country = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)

    # Billing address (can be same as shipping)
    billing_name = models.CharField(max_length=200, blank=True, null=True)
    billing_address_line1 = models.CharField(max_length=200, blank=True, null=True)
    billing_address_line2 = models.CharField(max_length=200, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state = models.CharField(max_length=100, blank=True, null=True)
    billing_country = models.CharField(max_length=100, blank=True, null=True)
    billing_postal_code = models.CharField(max_length=20, blank=True, null=True)

    same_as_shipping = models.BooleanField(default=True)

    # Order details
    items = models.JSONField(
        default=list, help_text="Snapshot of ordered products at time of purchase"
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Tax amount"
    )
    shipping_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Shipping fee"
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Discount applied"
    )
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Payment tracking
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending"
    )
    payment_method = models.CharField(
        max_length=50, blank=True, null=True, help_text="stripe, flutterwave, etc."
    )
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)

    # Status
    status = models.CharField(
        max_length=20, choices=ORDER_STATUS_CHOICES, default="pending"
    )
    notes = models.TextField(blank=True, help_text="Order notes/internal comments")

    # Fulfillment
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    tracking_url = models.URLField(blank=True, null=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["website", "-created_at"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["user"]),
            models.Index(fields=["email"]),
            models.Index(fields=["status"]),
            models.Index(fields=["payment_status"]),
        ]

    def __str__(self):
        return f"Order #{self.order_number}"


class OrderItem(models.Model):
    """Line items for an order"""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name = models.CharField(max_length=200, help_text="Snapshot of product name")
    variant_name = models.CharField(
        max_length=200, blank=True, null=True, help_text="Snapshot of variant"
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        variant = f" - {self.variant_name}" if self.variant_name else ""
        return f"{self.product_name}{variant} x {self.quantity}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class Coupon(models.Model):
    """Discount coupons"""

    CODE_TYPE_CHOICES = [
        ("percentage", "Percentage"),
        ("fixed", "Fixed Amount"),
        ("shipping", "Free Shipping"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("expired", "Expired"),
    ]

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="coupons"
    )
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=20, choices=CODE_TYPE_CHOICES)
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2, help_text="Percentage or fixed amount"
    )
    minimum_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, help_text="Minimum order amount"
    )
    maximum_discount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    usage_limit = models.IntegerField(
        default=0, help_text="0 for unlimited, else max uses"
    )
    used_count = models.IntegerField(default=0)
    per_customer_limit = models.IntegerField(
        default=0, help_text="0 for unlimited per customer"
    )
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    applicable_products = models.ManyToManyField(
        Product, blank=True, related_name="applicable_coupons"
    )
    exclude_products = models.ManyToManyField(
        Product, blank=True, related_name="excluded_coupons"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["website"]),
            models.Index(fields=["code"]),
            models.Index(fields=["is_active", "valid_from", "valid_until"]),
        ]

    def __str__(self):
        return self.code

    @property
    def is_valid(self):
        from django.utils import timezone

        now = timezone.now()
        if not self.is_active:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.usage_limit > 0 and self.used_count >= self.usage_limit:
            return False
        return True


class ProductReview(models.Model):
    """Customer product reviews"""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="reviews"
    )
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    helpful_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "-created_at"]),
            models.Index(fields=["rating"]),
            models.Index(fields=["is_approved"]),
        ]
        unique_together = ["product", "user"]

    def __str__(self):
        return f"Review for {self.product.name} by {self.user.username if self.user else 'Anonymous'}"


class Wishlist(models.Model):
    """User wishlist items"""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="wishlists"
    )
    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="wishlists"
    )
    products = models.ManyToManyField(Product, related_name="wishlisted_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "website"]),
        ]
        unique_together = ["user", "website"]

    def __str__(self):
        return f"{self.user.username}'s wishlist on {self.website.name}"


# ============================================
# SEO MODULE
# ============================================


class SeoSettings(models.Model):
    """SEO settings per website"""

    website = models.OneToOneField(
        Website, on_delete=models.CASCADE, related_name="seo_settings"
    )
    google_analytics_id = models.CharField(max_length=50, blank=True, null=True)
    google_tag_manager_id = models.CharField(max_length=50, blank=True, null=True)
    google_search_console_id = models.CharField(max_length=100, blank=True, null=True)
    bing_webmaster_id = models.CharField(max_length=100, blank=True, null=True)
    default_og_image = models.URLField(
        blank=True, null=True, help_text="Default Open Graph image"
    )
    robots_txt = models.TextField(
        blank=True,
        default="User-agent: *\nAllow: /\nDisallow: /admin/",
        help_text="robots.txt content",
    )
    sitemap_frequency = models.CharField(
        max_length=20,
        choices=[
            ("daily", "Daily"),
            ("weekly", "Weekly"),
            ("monthly", "Monthly"),
            ("yearly", "Yearly"),
        ],
        default="weekly",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SEO Settings for {self.website.name}"


class SitemapUrl(models.Model):
    """Individual URLs for sitemap generation"""

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="sitemap_urls"
    )
    loc = models.CharField(max_length=500, help_text="Full URL")
    lastmod = models.DateTimeField(null=True, blank=True)
    changefreq = models.CharField(
        max_length=20,
        choices=[
            ("always", "Always"),
            ("hourly", "Hourly"),
            ("daily", "Daily"),
            ("weekly", "Weekly"),
            ("monthly", "Monthly"),
            ("yearly", "Yearly"),
            ("never", "Never"),
        ],
        default="weekly",
    )
    priority = models.DecimalField(
        max_digits=2, decimal_places=1, default=0.5, validators=[MinValueValidator(0.1), MaxValueValidator(1.0)]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["website", "is_active"]),
        ]

    def __str__(self):
        return self.loc


# ============================================
# CODE EXPORT MODULE
# ============================================


class ExportedWebsite(models.Model):
    """Records of website code exports"""

    EXPORT_TYPE_CHOICES = [
        ("html", "HTML/CSS/JS"),
        ("zip", "ZIP Archive"),
        ("github", "GitHub Repository"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="exports"
    )
    export_type = models.CharField(max_length=20, choices=EXPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    file = models.FileField(
        upload_to="exports/%Y/%m/", null=True, blank=True, help_text="Exported file"
    )
    file_size = models.IntegerField(default=0, help_text="File size in bytes")
    download_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["website", "-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Export of {self.website.name} ({self.export_type})"


# ============================================
# PLUGIN/EXTENSION MODULE
# ============================================


class Plugin(models.Model):
    """Available plugins/extensions"""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("beta", "Beta"),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    version = models.CharField(max_length=20)
    author = models.CharField(max_length=100, blank=True)
    website_url = models.URLField(blank=True, null=True)
    icon = models.URLField(blank=True, null=True)
    settings_schema = models.JSONField(
        default=dict, help_text="JSON schema for plugin settings"
    )
    default_settings = models.JSONField(
        default=dict, help_text="Default plugin configuration"
    )
    required_plan = models.ForeignKey(
        BillingPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Plan required to use this plugin",
    )
    is_builtin = models.BooleanField(
        default=False, help_text="Built into the platform"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} v{self.version}"


class InstalledPlugin(models.Model):
    """Plugins installed on a website"""

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="installed_plugins"
    )
    plugin = models.ForeignKey(Plugin, on_delete=models.CASCADE)
    settings = models.JSONField(default=dict, help_text="User-configured settings")
    is_enabled = models.BooleanField(default=True)
    installed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["website", "plugin"]
        indexes = [
            models.Index(fields=["website", "is_enabled"]),
            models.Index(fields=["plugin"]),
        ]

    def __str__(self):
        return f"{self.plugin.name} on {self.website.name}"


# ============================================
# AUTOMATION / WEBHOOK MODULE
# ============================================


class Webhook(models.Model):
    """Outgoing webhooks for integrations"""

    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name="webhooks")
    name = models.CharField(max_length=100, help_text="Webhook name")
    url = models.URLField(help_text="Webhook endpoint URL")
    method = models.CharField(
        max_length=10,
        choices=[("POST", "POST"), ("PUT", "PUT"), ("PATCH", "PATCH")],
        default="POST",
    )
    headers = models.JSONField(
        default=dict, blank=True, help_text="Custom headers as JSON"
    )
    events = models.JSONField(
        default=list, help_text="Events to trigger this webhook"
    )
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    failure_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} -> {self.url}"


class Automation(models.Model):
    """Website automations (if this, then that)"""

    TRIGGER_CHOICES = [
        ("form_submission", "Form Submission"),
        ("new_order", "New Order"),
        ("product_created", "Product Created"),
        ("visitor_count", "Visitor Count"),
        ("time_based", "Time Based"),
    ]

    ACTION_CHOICES = [
        ("send_email", "Send Email"),
        ("send_webhook", "Send Webhook"),
        ("add_tag", "Add Tag"),
        ("update_field", "Update Field"),
        ("create_task", "Create Task"),
    ]

    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name="automations")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    trigger = models.CharField(max_length=50, choices=TRIGGER_CHOICES)
    trigger_conditions = models.JSONField(
        default=dict, blank=True, help_text="Conditions for trigger"
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    action_data = models.JSONField(
        default=dict, help_text="Data for the action"
    )
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    run_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} on {self.website.name}"


# ============================================
# FORM BUILDER ENHANCEMENT
# ============================================


class Form(models.Model):
    """Custom forms with field definitions"""

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="forms"
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    fields = models.JSONField(
        default=list, help_text="List of field definitions (type, label, required, etc.)"
    )
    submit_text = models.CharField(max_length=50, default="Submit")
    success_message = models.TextField(
        default="Thank you for your submission!", blank=True
    )
    email_notifications = models.JSONField(
        default=list, blank=True, help_text="List of emails to notify"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["website", "slug"]
        indexes = [
            models.Index(fields=["website"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return f"{self.name} on {self.website.name}"


class FormField(models.Model):
    """Legacy form fields (kept for backward compatibility)"""

    FIELD_TYPES = [
        ("text", "Text"),
        ("email", "Email"),
        ("tel", "Telephone"),
        ("textarea", "Textarea"),
        ("select", "Dropdown"),
        ("checkbox", "Checkbox"),
        ("radio", "Radio"),
        ("file", "File Upload"),
        ("date", "Date"),
        ("number", "Number"),
    ]

    form = models.ForeignKey(
        Form, on_delete=models.CASCADE, related_name="field_definitions", null=True, blank=True
    )
    name = models.CharField(max_length=100, help_text="Field name (for backend)")
    label = models.CharField(max_length=200, help_text="Field label (for user)")
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES)
    is_required = models.BooleanField(default=False)
    placeholder = models.CharField(max_length=200, blank=True, null=True)
    default_value = models.CharField(max_length=500, blank=True, null=True)
    choices = models.JSONField(
        default=list, blank=True, help_text="Options for select/radio fields"
    )
    validation = models.JSONField(
        default=dict, blank=True, help_text="Validation rules (min, max, pattern, etc.)"
    )
    help_text = models.CharField(max_length=255, blank=True, null=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]
        indexes = [
            models.Index(fields=["form"]),
        ]

    def __str__(self):
        return f"{self.label} ({self.field_type})"


# ============================================
# NEWSLETTER / EMAIL MARKETING MODULE
# ============================================


class NewsletterSubscriber(models.Model):
    """Newsletter subscription management"""

    email = models.EmailField(unique=True)
    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="subscribers"
    )
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(
        max_length=100, blank=True, null=True, help_text="How they subscribed"
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["website", "is_active"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return self.email


class EmailCampaign(models.Model):
    """Email marketing campaigns"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("sending", "Sending"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    ]

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="email_campaigns"
    )
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=200)
    body = models.TextField(help_text="HTML content")
    plain_text = models.TextField(blank=True, help_text="Plain text version")
    from_name = models.CharField(max_length=100, default="noreply")
    from_email = models.EmailField(default="noreply@example.com")
    reply_to = models.EmailField(blank=True, null=True)

    # Targeting
    recipient_list = models.JSONField(
        default=list, help_text="List of recipient emails or segment ID"
    )
    include_subscribers = models.BooleanField(default=True)
    include_customers = models.BooleanField(default=False)

    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    # Stats
    total_recipients = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)
    bounced_count = models.IntegerField(default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    error_message = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["website", "-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.status}"


# ============================================
# ANALYTICS ENHANCEMENT
# ============================================


class PageView(models.Model):
    """Detailed page view tracking"""

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="page_views"
    )
    page_url = models.CharField(max_length=500)
    page_title = models.CharField(max_length=200, blank=True, null=True)
    referrer = models.URLField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    device_type = models.CharField(
        max_length=20,
        choices=[
            ("desktop", "Desktop"),
            ("mobile", "Mobile"),
            ("tablet", "Tablet"),
            ("unknown", "Unknown"),
        ],
        default="unknown",
    )
    browser = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    session_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["website", "-created_at"]),
            models.Index(fields=["page_url"]),
            models.Index(fields=["session_id"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"View of {self.page_url} on {self.website.name}"


class Conversion(models.Model):
    """Track conversions (purchases, sign-ups, etc.)"""

    CONVERSION_TYPE_CHOICES = [
        ("purchase", "Purchase"),
        ("newsletter_signup", "Newsletter Signup"),
        ("contact_form", "Contact Form Submission"),
        ("lead", "Lead Generation"),
        ("custom", "Custom Event"),
    ]

    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="conversions"
    )
    conversion_type = models.CharField(max_length=30, choices=CONVERSION_TYPE_CHOICES)
    name = models.CharField(max_length=200, help_text="Conversion name")
    value = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, help_text="Monetary value"
    )
    order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="conversions"
    )
    form_submission = models.ForeignKey(
        FormSubmission, on_delete=models.SET_NULL, null=True, blank=True
    )
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="conversions"
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    referrer = models.URLField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["website", "-created_at"]),
            models.Index(fields=["conversion_type"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.conversion_type} on {self.website.name}"
