"""
Django ORM CRUD Operations Reference
=====================================
This file contains CRUD operations for all models in the Website Builder app.
Use this as a reference for database operations.
"""

# ============================================
# AUTHENTICATION & USER MODELS
# ============================================

from django.contrib.auth.models import User
from core.models import (
    UserProfile,
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
)

# ----------------------
# User / Authentication
# ----------------------

# CREATE - Register new user
user = User.objects.create_user(
    username="johndoe",
    email="john@example.com",
    password="securepassword123",
    first_name="John",
    last_name="Doe",
)

# READ - Get user by username
user = User.objects.get(username="johndoe")

# READ - Get user by email
user = User.objects.get(email="john@example.com")

# READ - List all users
all_users = User.objects.all()

# UPDATE - Update user
user.first_name = "Jane"
user.save()

# DELETE - Delete user
user.delete()

# ----------------------
# UserProfile
# ----------------------

# CREATE - Create profile for existing user
profile = UserProfile.objects.create(
    user=user,
    phone="+1234567890",
    bio="Hello, I am a web developer",
    is_email_verified=True,
)

# READ - Get user's profile
profile = user.profile  # Using related_name
profile = UserProfile.objects.get(user=user)

# UPDATE - Update profile
profile.phone = "+9876543210"
profile.bio = "Updated bio"
profile.save()

# ----------------------
# UserBillingPlan
# ----------------------

# CREATE
billing_plan = UserBillingPlan.objects.create(
    user=user,
    plan=BillingPlan.objects.first(),  # Or None
    has_selected_plan=True,
)

# READ - Get user's billing plan
user_billing_plan = user.billing_plan  # Using related_name

# UPDATE
user_billing_plan.plan = billing_plan
user_billing_plan.has_selected_plan = True
user_billing_plan.save()

# ----------------------
# Subscription
# ----------------------

# CREATE
subscription = Subscription.objects.create(
    user=user,
    plan="premium",
    status="active",
    stripe_customer_id="cus_xxx",
    stripe_subscription_id="sub_xxx",
)

# READ
subscription = user.subscription  # Using related_name
subscription = Subscription.objects.get(user=user)

# UPDATE - Update subscription plan
subscription.plan = "business"
subscription.status = "active"
subscription.save()

# UPDATE - Cancel subscription
subscription.status = "cancelled"
subscription.stripe_subscription_id = None
subscription.save()

# ============================================
# BILLING MODULE
# ============================================

# ----------------------
# BillingPlan
# ----------------------

# CREATE
plan = BillingPlan.objects.create(
    name="Pro Plan",
    slug="pro-plan",
    price=29.99,
    billing_period="monthly",
    description="Professional plan with all features",
    max_websites=10,
    max_templates_access=-1,
    can_use_custom_domain=True,
    can_remove_branding=True,
    can_access_api=True,
    can_have_team_members=True,
    max_team_members=5,
    has_priority_support=True,
    has_analytics=True,
    has_white_label=False,
    can_order_custom_template=True,
    is_active=True,
    stripe_price_id="price_xxx",
)

# READ - Get all active plans
plans = BillingPlan.objects.filter(is_active=True).order_by("price")

# READ - Get plan by slug
plan = BillingPlan.objects.get(slug="pro-plan")

# READ - Get plan by ID
plan = BillingPlan.objects.get(id=1)

# UPDATE
plan.price = 39.99
plan.save()

# DELETE (soft delete - just set is_active=False)
plan.is_active = False
plan.save()

# ----------------------
# BillingPlanFeature
# ----------------------

# CREATE
feature = BillingPlanFeature.objects.create(
    plan=plan, feature_name="Custom Domain", feature_value="Unlimited", is_included=True
)

# READ - Get all features for a plan
features = plan.features.all()

# UPDATE
feature.is_included = False
feature.save()

# DELETE
feature.delete()

# ============================================
# WEBSITE MODULE
# ============================================

# ----------------------
# Website
# ----------------------

# CREATE
website = Website.objects.create(
    owner=user,
    name="My First Website",
    slug="my-first-website",
    content="<html><body>Hello World</body></html>",
    status="draft",
    is_published=False,
)

# READ - Get all websites for a user
websites = Website.objects.filter(owner=user).order_by("-created_at")

# READ - Get website by slug
website = Website.objects.get(slug="my-first-website")

# READ - Get website by ID
website = Website.objects.get(id=1)

# UPDATE - Update website
website.content = "<html><body>Updated Content</body></html>"
website.status = "published"
website.is_published = True
website.save()

# DELETE
website.delete()

# ----------------------
# TeamMember
# ----------------------

# CREATE - Add team member
team_member = TeamMember.objects.create(
    website=website, user=other_user, role="editor", invited_by=user
)

# READ - Get all team members for a website
team_members = website.team_members.filter(is_active=True)

# READ - Get all websites user is member of
memberships = other_user.team_memberships.filter(is_active=True)

# UPDATE - Change role
team_member.role = "admin"
team_member.accepted_at = timezone.now()  # If first time
team_member.save()

# DELETE (deactivate)
team_member.is_active = False
team_member.save()

# ----------------------
# Domain
# ----------------------

# CREATE - Add custom domain
domain = Domain.objects.create(
    website=website,
    domain="mywebsite.com",
    is_primary=True,
    is_verified=False,
    verification_code="abc123",
)

# READ - Get all domains for a website
domains = Domain.objects.filter(website=website)

# READ - Get domain by domain name
domain = Domain.objects.get(domain="mywebsite.com")

# UPDATE - Verify domain
domain.is_verified = True
domain.ssl_enabled = True
domain.save()

# UPDATE - Set as primary domain
Domain.objects.filter(website=website).update(is_primary=False)
domain.is_primary = True
domain.save()

# DELETE
domain.delete()

# ----------------------
# PageElement
# ----------------------

# CREATE - Add element to page
element = PageElement.objects.create(
    website=website,
    page_name="index",
    element_type="header",
    element_data={"title": "Welcome", "subtitle": "Subtitle"},
    position=0,
    is_visible=True,
)

# READ - Get all elements for a page
elements = PageElement.objects.filter(website=website, page_name="index").order_by(
    "position"
)

# READ - Get element by ID
element = PageElement.objects.get(id=1)

# UPDATE - Update element
element.element_data = {"title": "New Title"}
element.position = 1
element.save()

# DELETE
element.delete()

# ============================================
# TEMPLATE MODULE
# ============================================

# ----------------------
# Template
# ----------------------

# CREATE
template = Template.objects.create(
    name="Business Template",
    slug="business-template",
    description="A clean business template",
    category="business",
    preview_image="https://example.com/preview.jpg",
    template_file="<html>...</html>",
    price=49.99,
    is_free=False,
    is_premium=True,
    tags=["business", "clean", "modern"],
)

# READ - Get all active templates
templates = Template.objects.filter(is_active=True)

# READ - Get by category
templates = Template.objects.filter(category="business", is_active=True)

# READ - Get free templates
free_templates = Template.objects.filter(is_free=True, is_active=True)

# READ - Search templates
templates = Template.objects.filter(
    is_active=True,
    name__icontains="business",  # Search by name
)

# READ - Get by slug
template = Template.objects.get(slug="business-template")

# UPDATE
template.price = 59.99
template.save()

# DELETE
template.delete()

# ----------------------
# UserTemplate
# ----------------------

# CREATE - User copies/purchases a template
user_template = UserTemplate.objects.create(
    user=user,
    template=template,
    name="My Business Site",
    content=template.template_file,
    website=website,  # Optional - link to a website
)

# READ - Get user's all templates
user_templates = UserTemplate.objects.filter(user=user)

# READ - Get user's template by ID
user_template = UserTemplate.objects.get(id=1, user=user)

# READ - Check if user owns template
owns_template = UserTemplate.objects.filter(user=user, template=template).exists()

# UPDATE
user_template.name = "Updated Name"
user_template.content = "<html>New Content</html>"
user_template.save()

# DELETE
user_template.delete()

# ----------------------
# TemplatePurchase
# ----------------------

# CREATE
purchase = TemplatePurchase.objects.create(
    user=user,
    template=template,
    user_template=user_template,
    amount=49.99,
    payment_status="completed",
    stripe_payment_id="pi_xxx",
)

# READ - Get user's purchases
purchases = TemplatePurchase.objects.filter(user=user)

# READ - Get purchases by status
pending_purchases = TemplatePurchase.objects.filter(payment_status="pending")

# UPDATE
purchase.payment_status = "completed"
purchase.save()

# ----------------------
# TemplateOrder
# ----------------------

# CREATE - Order custom template
order = TemplateOrder.objects.create(
    user=user,
    order_type="custom_design",
    title="Custom E-commerce Template",
    description="I need a custom e-commerce template",
    requirements="Must have product pages, cart, checkout",
    status="pending",
)

# READ - Get user's orders
orders = TemplateOrder.objects.filter(user=user)

# READ - Get all orders (admin)
all_orders = TemplateOrder.objects.all()

# READ - Get by status
pending_orders = TemplateOrder.objects.filter(status="pending")

# UPDATE - Update order status
order.status = "quoted"
order.quoted_price = 299.99
order.save()

# UPDATE - Complete order (deliver template)
order.status = "completed"
order.delivered_template_id = template.id
order.save()

# DELETE
order.delete()

# ============================================
# PAYMENT MODULE
# ============================================

# ----------------------
# Payment
# ----------------------

# CREATE
payment = Payment.objects.create(
    user=user,
    subscription=subscription,
    amount=29.99,
    currency="USD",
    payment_method="card",
    stripe_payment_intent_id="pi_xxx",
    status="pending",
    description="Premium Plan Subscription",
)

# READ - Get user's payments
payments = Payment.objects.filter(user=user).order_by("-created_at")

# READ - Get payment by ID
payment = Payment.objects.get(id="uuid-here")

# READ - Get by status
pending_payments = Payment.objects.filter(status="pending")

# UPDATE
payment.status = "completed"
payment.stripe_charge_id = "ch_xxx"
payment.save()

# DELETE
payment.delete()

# ----------------------
# Invoice
# ----------------------

# CREATE
invoice = Invoice.objects.create(
    user=user,
    payment=payment,
    invoice_number="INV-001",
    amount_due=29.99,
    amount_paid=0,
    currency="USD",
    status="draft",
    description="Premium Plan",
)

# READ - Get user's invoices
invoices = Invoice.objects.filter(user=user)

# READ - Get by invoice number
invoice = Invoice.objects.get(invoice_number="INV-001")

# UPDATE - Mark as paid
invoice.status = "paid"
invoice.amount_paid = invoice.amount_due
invoice.paid_at = timezone.now()
invoice.save()

# DELETE
invoice.delete()

# ----------------------
# InvoiceItem
# ----------------------

# CREATE
item = InvoiceItem.objects.create(
    invoice=invoice,
    description="Premium Plan - Monthly",
    quantity=1,
    unit_amount=29.99,
    amount=29.99,
)

# READ - Get items for an invoice
items = invoice.items.all()

# UPDATE
item.quantity = 2
item.amount = item.quantity * item.unit_amount
item.save()

# DELETE
item.delete()

# ============================================
# COMMON QUERIES
# ============================================

# Get user with subscription and billing plan
user_with_plan = User.objects.select_related("subscription", "billing_plan").get(
    username="johndoe"
)

# Get website with owner info
website_with_owner = Website.objects.select_related("owner").get(id=1)

# Get template with required plan info
template_with_plan = Template.objects.select_related("required_plan").get(id=1)

# Complex query - Get user's orders with invoice info
orders_with_invoice = TemplateOrder.objects.select_related(
    "invoice", "delivered_template"
).filter(user=user)

# Get all active subscriptions
active_subs = Subscription.objects.filter(status="active")

# Get user's complete profile
user_profile = User.objects.prefetch_related(
    "profile", "subscription", "billing_plan"
).get(id=user.id)
