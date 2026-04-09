from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import uuid


# ============================================
# AUTHENTICATION MODULE
# ============================================


class UserProfile(models.Model):
    """Extended user profile for email verification and social login"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True)
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
            models.Index(fields=["email_verification_token"]),
            models.Index(fields=["password_reset_token"]),
        ]

    def __str__(self):
        return f"Profile of {self.user.username}"

    def generate_email_verification_token(self):
        import secrets

        self.email_verification_token = secrets.token_urlsafe(32)
        return self.email_verification_token

    def generate_password_reset_token(self):
        import secrets

        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires = timezone.now() + timezone.timedelta(hours=24)
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
        ("premium", "Premium"),
        ("business", "Business"),
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
        ]

    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency}"


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
