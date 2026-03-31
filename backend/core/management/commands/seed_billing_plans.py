from django.core.management.base import BaseCommand
from core.models import BillingPlan, BillingPlanFeature


class Command(BaseCommand):
    help = 'Seed the database with default billing plans'

    def handle(self, *args, **options):
        self.stdout.write('Creating billing plans...')

        # Free Plan
        free_plan, created = BillingPlan.objects.get_or_create(
            slug='free',
            defaults={
                'name': 'Free',
                'price': 0,
                'billing_period': 'monthly',
                'description': 'Perfect for getting started with basic website building',
                'max_websites': 1,
                'max_templates_access': 0,
                'can_use_custom_domain': False,
                'can_remove_branding': False,
                'can_access_api': False,
                'can_have_team_members': False,
                'max_team_members': 0,
                'has_priority_support': False,
                'has_analytics': False,
                'has_white_label': False,
                'can_order_custom_template': False,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Free plan'))
        else:
            self.stdout.write(f'Free plan already exists')

        # Starter Plan
        starter_plan, created = BillingPlan.objects.get_or_create(
            slug='starter',
            defaults={
                'name': 'Starter',
                'price': 9.99,
                'billing_period': 'monthly',
                'description': 'Ideal for individuals and small projects',
                'max_websites': 3,
                'max_templates_access': 5,
                'can_use_custom_domain': True,
                'can_remove_branding': False,
                'can_access_api': False,
                'can_have_team_members': False,
                'max_team_members': 0,
                'has_priority_support': False,
                'has_analytics': True,
                'has_white_label': False,
                'can_order_custom_template': False,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Starter plan'))
        else:
            self.stdout.write(f'Starter plan already exists')

        # Pro Plan
        pro_plan, created = BillingPlan.objects.get_or_create(
            slug='pro',
            defaults={
                'name': 'Pro',
                'price': 19.99,
                'billing_period': 'monthly',
                'description': 'For professionals who need more features and templates',
                'max_websites': 10,
                'max_templates_access': -1,  # All templates
                'can_use_custom_domain': True,
                'can_remove_branding': True,
                'can_access_api': True,
                'can_have_team_members': False,
                'max_team_members': 0,
                'has_priority_support': True,
                'has_analytics': True,
                'has_white_label': False,
                'can_order_custom_template': False,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Pro plan'))
        else:
            self.stdout.write(f'Pro plan already exists')

        # Business Plan
        business_plan, created = BillingPlan.objects.get_or_create(
            slug='business',
            defaults={
                'name': 'Business',
                'price': 49.99,
                'billing_period': 'monthly',
                'description': 'For growing businesses with team collaboration needs',
                'max_websites': -1,  # Unlimited
                'max_templates_access': -1,  # All templates
                'can_use_custom_domain': True,
                'can_remove_branding': True,
                'can_access_api': True,
                'can_have_team_members': True,
                'max_team_members': 5,
                'has_priority_support': True,
                'has_analytics': True,
                'has_white_label': True,
                'can_order_custom_template': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Business plan'))
        else:
            self.stdout.write(f'Business plan already exists')

        # Enterprise Plan
        enterprise_plan, created = BillingPlan.objects.get_or_create(
            slug='enterprise',
            defaults={
                'name': 'Enterprise',
                'price': 99.99,
                'billing_period': 'monthly',
                'description': 'Full-featured solution for large organizations',
                'max_websites': -1,  # Unlimited
                'max_templates_access': -1,  # All templates
                'can_use_custom_domain': True,
                'can_remove_branding': True,
                'can_access_api': True,
                'can_have_team_members': True,
                'max_team_members': -1,  # Unlimited
                'has_priority_support': True,
                'has_analytics': True,
                'has_white_label': True,
                'can_order_custom_template': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created Enterprise plan'))
        else:
            self.stdout.write(f'Enterprise plan already exists')

        self.stdout.write(self.style.SUCCESS('Billing plans seeding completed!'))
