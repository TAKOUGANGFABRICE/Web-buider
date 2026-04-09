"""
Seed Database Management Command

Usage:
    python manage.py seed_database
    python manage.py seed_database --full  # Include all sample data
    python manage.py seed_database --plans-only  # Only seed billing plans
    python manage.py seed_database --templates-only  # Only seed templates
    python manage.py seed_database --demo  # Create demo users and data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from core.models import (
    BillingPlan, BillingPlanFeature, Subscription, Website,
    Template, UserTemplate, TemplatePurchase, TemplateOrder,
    Payment, Invoice, InvoiceItem, TeamMember, Domain, PageElement
)


class Command(BaseCommand):
    help = 'Seed the database with sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--full',
            action='store_true',
            help='Seed all sample data including users and websites',
        )
        parser.add_argument(
            '--plans-only',
            action='store_true',
            help='Only seed billing plans',
        )
        parser.add_argument(
            '--templates-only',
            action='store_true',
            help='Only seed templates',
        )
        parser.add_argument(
            '--demo',
            action='store_true',
            help='Create demo users and data',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        if options['plans_only']:
            self.seed_billing_plans()
        elif options['templates_only']:
            self.seed_templates()
        elif options['demo']:
            self.seed_demo_data()
        else:
            self.seed_billing_plans()
            self.seed_templates()
            if options['full']:
                self.seed_demo_users()
                self.seed_subscriptions()
                self.seed_websites()
                self.seed_payments()

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))

    def clear_data(self):
        """Clear all data from tables"""
        models_to_clear = [
            PageElement, Domain, TeamMember,
            TemplatePurchase, TemplateOrder, UserTemplate,
            Payment, InvoiceItem, Invoice,
            Website, Subscription,
            Template, UserBillingPlan,
            BillingPlanFeature, BillingPlan,
        ]
        
        for model in models_to_clear:
            count = model.objects.count()
            model.objects.all().delete()
            self.stdout.write(f'  Cleared {count} {model.__name__} records')

    def seed_billing_plans(self):
        """Seed billing plans"""
        self.stdout.write('\n📋 Seeding Billing Plans...')
        
        plans_data = [
            {
                'name': 'Free',
                'slug': 'free',
                'price': Decimal('0.00'),
                'billing_period': 'monthly',
                'description': 'Perfect for getting started with your first website',
                'max_websites': 1,
                'max_templates_access': 3,
                'can_use_custom_domain': False,
                'can_remove_branding': False,
                'can_access_api': False,
                'can_have_team_members': False,
                'max_team_members': 0,
                'has_priority_support': False,
                'has_analytics': False,
                'has_white_label': False,
                'can_order_custom_template': False,
                'features': [
                    ('Max Websites', '1'),
                    ('Templates Access', '3 Free Templates'),
                    ('Storage', '500 MB'),
                    ('Bandwidth', '1 GB/month'),
                ],
            },
            {
                'name': 'Basic',
                'slug': 'basic',
                'price': Decimal('9.99'),
                'billing_period': 'monthly',
                'description': 'Great for personal websites and portfolios',
                'max_websites': 3,
                'max_templates_access': -1,  # All templates
                'can_use_custom_domain': True,
                'can_remove_branding': False,
                'can_access_api': False,
                'can_have_team_members': False,
                'max_team_members': 0,
                'has_priority_support': False,
                'has_analytics': True,
                'has_white_label': False,
                'can_order_custom_template': False,
                'features': [
                    ('Max Websites', '3'),
                    ('Templates Access', 'All Templates'),
                    ('Custom Domain', '✓'),
                    ('Analytics', 'Basic'),
                    ('Storage', '5 GB'),
                    ('Bandwidth', '10 GB/month'),
                ],
            },
            {
                'name': 'Pro',
                'slug': 'pro',
                'price': Decimal('29.99'),
                'billing_period': 'monthly',
                'description': 'For growing businesses and agencies',
                'max_websites': 10,
                'max_templates_access': -1,
                'can_use_custom_domain': True,
                'can_remove_branding': True,
                'can_access_api': True,
                'can_have_team_members': True,
                'max_team_members': 5,
                'has_priority_support': True,
                'has_analytics': True,
                'has_white_label': False,
                'can_order_custom_template': True,
                'features': [
                    ('Max Websites', '10'),
                    ('Templates Access', 'All Templates + Premium'),
                    ('Custom Domain', '✓'),
                    ('Remove Branding', '✓'),
                    ('API Access', '✓'),
                    ('Team Members', '5'),
                    ('Priority Support', '✓'),
                    ('Advanced Analytics', '✓'),
                    ('Custom Templates', '✓'),
                    ('Storage', '50 GB'),
                    ('Bandwidth', '100 GB/month'),
                ],
            },
            {
                'name': 'Enterprise',
                'slug': 'enterprise',
                'price': Decimal('99.99'),
                'billing_period': 'monthly',
                'description': 'For large organizations with advanced needs',
                'max_websites': -1,  # Unlimited
                'max_templates_access': -1,
                'can_use_custom_domain': True,
                'can_remove_branding': True,
                'can_access_api': True,
                'can_have_team_members': True,
                'max_team_members': -1,  # Unlimited
                'has_priority_support': True,
                'has_analytics': True,
                'has_white_label': True,
                'can_order_custom_template': True,
                'features': [
                    ('Max Websites', 'Unlimited'),
                    ('Templates Access', 'All Templates'),
                    ('Custom Domain', 'Multiple'),
                    ('Remove Branding', '✓'),
                    ('API Access', 'Full API'),
                    ('Team Members', 'Unlimited'),
                    ('Priority Support', '24/7'),
                    ('Advanced Analytics', '✓'),
                    ('White Label', '✓'),
                    ('Custom Templates', 'Unlimited'),
                    ('SSO/SAML', '✓'),
                    ('Storage', 'Unlimited'),
                    ('Bandwidth', 'Unlimited'),
                ],
            },
            {
                'name': 'Basic Yearly',
                'slug': 'basic-yearly',
                'price': Decimal('99.99'),
                'billing_period': 'yearly',
                'description': 'Basic plan billed annually (Save 17%)',
                'max_websites': 3,
                'max_templates_access': -1,
                'can_use_custom_domain': True,
                'can_remove_branding': False,
                'can_access_api': False,
                'can_have_team_members': False,
                'max_team_members': 0,
                'has_priority_support': False,
                'has_analytics': True,
                'has_white_label': False,
                'can_order_custom_template': False,
                'features': [
                    ('Max Websites', '3'),
                    ('Templates Access', 'All Templates'),
                    ('Custom Domain', '✓'),
                    ('Analytics', 'Basic'),
                    ('Storage', '5 GB'),
                    ('Bandwidth', '10 GB/month'),
                    ('Billed Annually', 'Save 17%'),
                ],
            },
            {
                'name': 'Pro Yearly',
                'slug': 'pro-yearly',
                'price': Decimal('299.99'),
                'billing_period': 'yearly',
                'description': 'Pro plan billed annually (Save 17%)',
                'max_websites': 10,
                'max_templates_access': -1,
                'can_use_custom_domain': True,
                'can_remove_branding': True,
                'can_access_api': True,
                'can_have_team_members': True,
                'max_team_members': 5,
                'has_priority_support': True,
                'has_analytics': True,
                'has_white_label': False,
                'can_order_custom_template': True,
                'features': [
                    ('Max Websites', '10'),
                    ('Templates Access', 'All Templates + Premium'),
                    ('Custom Domain', '✓'),
                    ('Remove Branding', '✓'),
                    ('API Access', '✓'),
                    ('Team Members', '5'),
                    ('Priority Support', '✓'),
                    ('Advanced Analytics', '✓'),
                    ('Custom Templates', '✓'),
                    ('Billed Annually', 'Save 17%'),
                ],
            },
        ]

        for plan_data in plans_data:
            features = plan_data.pop('features')
            plan, created = BillingPlan.objects.get_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            
            if created:
                for feature_name, feature_value in features:
                    BillingPlanFeature.objects.create(
                        plan=plan,
                        feature_name=feature_name,
                        feature_value=feature_value,
                        is_included=True
                    )
                self.stdout.write(f'  ✓ Created plan: {plan.name}')
            else:
                self.stdout.write(f'  → Plan already exists: {plan.name}')

    def seed_templates(self):
        """Seed website templates"""
        self.stdout.write('\n🎨 Seeding Templates...')
        
        # Get the Basic plan for templates that require a plan
        basic_plan = BillingPlan.objects.filter(slug='basic').first()
        
        templates_data = [
            # Free Templates
            {
                'name': 'Minimal Portfolio',
                'slug': 'minimal-portfolio',
                'description': 'A clean, minimal portfolio template perfect for designers and photographers',
                'category': 'portfolio',
                'price': Decimal('0.00'),
                'is_free': True,
                'is_premium': False,
                'tags': ['minimal', 'clean', 'portfolio', 'photographer'],
                'template_file': '<!DOCTYPE html><html><head><title>Minimal Portfolio</title></head><body><h1>Minimal Portfolio</h1></body></html>',
            },
            {
                'name': 'Simple Blog',
                'slug': 'simple-blog',
                'description': 'A straightforward blog template with a modern design',
                'category': 'blog',
                'price': Decimal('0.00'),
                'is_free': True,
                'is_premium': False,
                'tags': ['blog', 'minimal', 'writing'],
                'template_file': '<!DOCTYPE html><html><head><title>Simple Blog</title></head><body><h1>Simple Blog</h1></body></html>',
            },
            {
                'name': 'Business Landing',
                'slug': 'business-landing',
                'description': 'Professional landing page for business websites',
                'category': 'landing',
                'price': Decimal('0.00'),
                'is_free': True,
                'is_premium': False,
                'tags': ['business', 'landing', 'professional'],
                'template_file': '<!DOCTYPE html><html><head><title>Business Landing</title></head><body><h1>Business Landing</h1></body></html>',
            },
            # Premium Templates
            {
                'name': 'Creative Agency',
                'slug': 'creative-agency',
                'description': 'Stunning template for creative agencies and design studios',
                'category': 'business',
                'price': Decimal('49.99'),
                'is_free': False,
                'is_premium': True,
                'required_plan': basic_plan,
                'tags': ['agency', 'creative', 'portfolio', 'modern'],
                'template_file': '<!DOCTYPE html><html><head><title>Creative Agency</title></head><body><h1>Creative Agency</h1></body></html>',
            },
            {
                'name': 'Restaurant & Cafe',
                'slug': 'restaurant-cafe',
                'description': 'Beautiful template for restaurants, cafes, and bars',
                'category': 'restaurant',
                'price': Decimal('59.99'),
                'is_free': False,
                'is_premium': True,
                'required_plan': basic_plan,
                'tags': ['restaurant', 'cafe', 'food', 'menu'],
                'template_file': '<!DOCTYPE html><html><head><title>Restaurant</title></head><body><h1>Restaurant</h1></body></html>',
            },
            {
                'name': 'E-Commerce Store',
                'slug': 'ecommerce-store',
                'description': 'Complete e-commerce template with product listings and cart',
                'category': 'ecommerce',
                'price': Decimal('79.99'),
                'is_free': False,
                'is_premium': True,
                'required_plan': basic_plan,
                'tags': ['ecommerce', 'shop', 'store', 'products'],
                'template_file': '<!DOCTYPE html><html><head><title>E-Commerce Store</title></head><body><h1>E-Commerce Store</h1></body></html>',
            },
            {
                'name': 'Real Estate',
                'slug': 'real-estate',
                'description': 'Professional template for real estate agencies and property listings',
                'category': 'real_estate',
                'price': Decimal('69.99'),
                'is_free': False,
                'is_premium': True,
                'required_plan': basic_plan,
                'tags': ['real estate', 'property', 'listing', 'agent'],
                'template_file': '<!DOCTYPE html><html><head><title>Real Estate</title></head><body><h1>Real Estate</h1></body></html>',
            },
            {
                'name': 'Online Course',
                'slug': 'online-course',
                'description': 'Template for online courses, tutorials, and educational content',
                'category': 'education',
                'price': Decimal('59.99'),
                'is_free': False,
                'is_premium': True,
                'required_plan': basic_plan,
                'tags': ['education', 'course', 'tutorial', 'learning'],
                'template_file': '<!DOCTYPE html><html><head><title>Online Course</title></head><body><h1>Online Course</h1></body></html>',
            },
            {
                'name': 'Non-Profit',
                'slug': 'nonprofit',
                'description': 'Template for non-profit organizations and charities',
                'category': 'nonprofit',
                'price': Decimal('39.99'),
                'is_free': False,
                'is_premium': False,
                'required_plan': basic_plan,
                'tags': ['nonprofit', 'charity', 'donation', 'organization'],
                'template_file': '<!DOCTYPE html><html><head><title>Non-Profit</title></head><body><h1>Non-Profit</h1></body></html>',
            },
            {
                'name': 'Event Landing',
                'slug': 'event-landing',
                'description': 'Landing page template for events, conferences, and webinars',
                'category': 'landing',
                'price': Decimal('29.99'),
                'is_free': False,
                'is_premium': False,
                'tags': ['event', 'conference', 'landing', 'registration'],
                'template_file': '<!DOCTYPE html><html><head><title>Event Landing</title></head><body><h1>Event Landing</h1></body></html>',
            },
        ]

        for template_data in templates_data:
            template, created = Template.objects.get_or_create(
                slug=template_data['slug'],
                defaults=template_data
            )
            
            if created:
                self.stdout.write(f'  ✓ Created template: {template.name}')
            else:
                self.stdout.write(f'  → Template already exists: {template.name}')

    def seed_demo_users(self):
        """Create demo users"""
        self.stdout.write('\n👤 Seeding Demo Users...')
        
        demo_users = [
            {
                'username': 'demo_user',
                'email': 'demo@example.com',
                'password': 'demo123456',
                'first_name': 'Demo',
                'last_name': 'User',
            },
            {
                'username': 'john_smith',
                'email': 'john@example.com',
                'password': 'john123456',
                'first_name': 'John',
                'last_name': 'Smith',
            },
            {
                'username': 'sarah_jones',
                'email': 'sarah@example.com',
                'password': 'sarah123456',
                'first_name': 'Sarah',
                'last_name': 'Jones',
            },
        ]

        for user_data in demo_users:
            password = user_data.pop('password')
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults=user_data
            )
            
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'  ✓ Created user: {user.username}')
            else:
                self.stdout.write(f'  → User already exists: {user.username}')

    def seed_subscriptions(self):
        """Create subscriptions for users"""
        self.stdout.write('\n📦 Seeding Subscriptions...')
        
        users = User.objects.all()[:3]
        plans = BillingPlan.objects.all()
        
        for i, user in enumerate(users):
            if not hasattr(user, 'subscription'):
                plan = plans[i] if i < len(plans) else plans[0]
                Subscription.objects.create(
                    user=user,
                    plan=plan.slug,
                    status='active',
                    current_period_start=timezone.now(),
                    current_period_end=timezone.now() + timedelta(days=30),
                )
                self.stdout.write(f'  ✓ Created subscription for: {user.username}')

    def seed_websites(self):
        """Create sample websites"""
        self.stdout.write('\n🌐 Seeding Websites...')
        
        users = User.objects.all()
        templates = Template.objects.all()[:5]
        
        for user in users:
            for i in range(random.randint(1, 3)):
                template = random.choice(templates)
                website = Website.objects.create(
                    owner=user,
                    name=f"{user.username.title()}'s Website {i + 1}",
                    slug=f"{user.username}-website-{i + 1}",
                    content=f"<html><body><h1>Welcome to {user.username.title()}'s Website</h1></body></html>",
                    template_used=template,
                    is_published=random.choice([True, False]),
                )
                self.stdout.write(f'  ✓ Created website: {website.name}')

    def seed_payments(self):
        """Create sample payments"""
        self.stdout.write('\n💳 Seeding Payments...')
        
        users = User.objects.all()
        
        for user in users:
            try:
                subscription = user.subscription
                
                # Create a payment for the subscription
                Payment.objects.create(
                    user=user,
                    subscription=subscription,
                    amount=Decimal('29.99'),
                    payment_method='card',
                    status='completed',
                    description=f'Subscription payment for {subscription.plan} plan',
                    stripe_payment_intent_id=f'pi_{uuid.uuid4().hex[:24]}',
                )
                
                # Create an invoice
                invoice = Invoice.objects.create(
                    user=user,
                    invoice_number=f'INV-{user.id:04d}-{timezone.now().strftime("%Y%m%d%H%M%S")}',
                    amount_due=Decimal('29.99'),
                    amount_paid=Decimal('29.99'),
                    status='paid',
                    paid_at=timezone.now(),
                    billing_name=f'{user.get_full_name() or user.username}',
                    billing_email=user.email,
                )
                
                # Add invoice items
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=f'{subscription.plan.title()} Plan - Monthly',
                    quantity=1,
                    unit_amount=Decimal('29.99'),
                    amount=Decimal('29.99'),
                )
                
                self.stdout.write(f'  ✓ Created payment for: {user.username}')
            except Exception as e:
                self.stdout.write(f'  → Skipped payment for: {user.username} ({str(e)})')


# Helper function to generate UUID
def uuid():
    import uuid as uuid_module
    return uuid_module.uuid4()
