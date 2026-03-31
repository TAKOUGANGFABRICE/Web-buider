from django.db import models
from django.contrib.auth.models import User
import uuid

# Billing Plan Models

class BillingPlan(models.Model):
    """Define available billing plans with their features"""
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period = models.CharField(max_length=20, choices=[
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ], default='monthly')
    description = models.TextField(blank=True)
    
    # Features as JSON field for flexibility
    max_websites = models.IntegerField(default=1)
    max_templates_access = models.IntegerField(default=0)  # 0 = none, -1 = all
    can_use_custom_domain = models.BooleanField(default=False)
    can_remove_branding = models.BooleanField(default=False)
    can_access_api = models.BooleanField(default=False)
    can_have_team_members = models.BooleanField(default=False)
    max_team_members = models.IntegerField(default=0)
    has_priority_support = models.BooleanField(default=False)
    has_analytics = models.BooleanField(default=False)
    has_white_label = models.BooleanField(default=False)
    can_order_custom_template = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    stripe_price_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_period}"


class BillingPlanFeature(models.Model):
    """Detailed features for each billing plan"""
    plan = models.ForeignKey(BillingPlan, on_delete=models.CASCADE, related_name='features')
    feature_name = models.CharField(max_length=100)
    feature_value = models.CharField(max_length=255)
    is_included = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.plan.name} - {self.feature_name}"


class UserBillingPlan(models.Model):
    """Track which billing plan a user has selected (required after signup)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='billing_plan')
    plan = models.ForeignKey(BillingPlan, on_delete=models.SET_NULL, null=True, blank=True)
    has_selected_plan = models.BooleanField(default=False)
    selected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name if self.plan else 'No Plan'}"


class Website(models.Model):
	owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='websites')
	name = models.CharField(max_length=100)
	content = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.name


# Template System Models

class Template(models.Model):
    """Website templates available for purchase"""
    TEMPLATE_CATEGORY_CHOICES = [
        ('portfolio', 'Portfolio'),
        ('business', 'Business'),
        ('ecommerce', 'E-Commerce'),
        ('blog', 'Blog'),
        ('landing', 'Landing Page'),
        ('restaurant', 'Restaurant'),
        ('real_estate', 'Real Estate'),
        ('education', 'Education'),
        ('nonprofit', 'Non-Profit'),
        ('other', 'Other'),
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
    required_plan = models.ForeignKey(BillingPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='included_templates')
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class UserTemplate(models.Model):
    """User's purchased/copied template - only they can customize it"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_templates')
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='user_copies')
    name = models.CharField(max_length=100)
    content = models.TextField()
    purchased_at = models.DateTimeField(auto_now_add=True)
    website = models.OneToOneField(Website, on_delete=models.CASCADE, null=True, blank=True, related_name='source_template')
    
    class Meta:
        ordering = ['-purchased_at']
    
    def __str__(self):
        return f"{self.user.username}'s copy of {self.template.name}"


class TemplatePurchase(models.Model):
    """Record of template purchases"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='template_purchases')
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='purchases')
    user_template = models.OneToOneField(UserTemplate, on_delete=models.CASCADE, null=True, blank=True, related_name='purchase')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ], default='pending')
    stripe_payment_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} purchased {self.template.name}"


class TemplateOrder(models.Model):
    """Custom template orders that generate invoices"""
    ORDER_TYPE_CHOICES = [
        ('custom_design', 'Custom Design'),
        ('template_customization', 'Template Customization'),
        ('modification', 'Modification Request'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('quoted', 'Quoted'),
        ('approved', 'Approved'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='template_orders')
    order_type = models.CharField(max_length=50, choices=ORDER_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    quoted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    invoice = models.OneToOneField('Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='template_order')
    delivered_template = models.ForeignKey(Template, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order #{self.id} - {self.title}"


class Subscription(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('premium', 'Premium'),
        ('business', 'Business'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('past_due', 'Past Due'),
        ('unpaid', 'Unpaid'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.plan}"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit Card'),
        ('mobile_money', 'Mobile Money'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    MOBILE_NETWORK_CHOICES = [
        ('orange', 'Orange Money'),
        ('mtn', 'MTN Mobile Money'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    mobile_network = models.CharField(max_length=20, choices=MOBILE_NETWORK_CHOICES, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency}"


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('paid', 'Paid'),
        ('void', 'Void'),
        ('uncollectible', 'Uncollectible'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invoices')
    payment = models.OneToOneField(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    stripe_invoice_id = models.CharField(max_length=255, blank=True, null=True)
    invoice_pdf_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    unit_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.description} - {self.amount}"
