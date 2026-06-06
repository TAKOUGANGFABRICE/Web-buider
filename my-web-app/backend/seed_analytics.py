from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import Website, PageView, Conversion

User = get_user_model()


def ensure_user():
    user, _ = User.objects.get_or_create(
        username='demo',
        defaults={'email': 'demo@example.com'}
    )
    user.set_password('demo123')
    user.save()
    return user


def ensure_website(user):
    website, _ = Website.objects.get_or_create(
        owner=user,
        name='Demo Site',
        defaults={
            'slug': 'demo-site',
            'status': 'published',
            'is_published': True,
        }
    )
    return website


def seed_page_views(website, days=30):
    paths = ['/', '/about', '/pricing', '/contact', '/blog']
    sources = ['Direct', 'Google', 'Twitter', 'LinkedIn']
    devices = ['desktop', 'mobile', 'tablet']
    countries = ['US', 'KE', 'GB', 'DE', 'NG']
    now = timezone.now()
    for i in range(days):
        day = now - timedelta(days=i)
        for _ in range(12):
            PageView.objects.create(
                website=website,
                page_url=paths[i % len(paths)],
                referrer=sources[i % len(sources)] if i % 3 else None,
                device_type=devices[i % len(devices)],
                country=countries[i % len(countries)],
                created_at=day - timedelta(minutes=(i * 7)),
            )


def seed_conversions(website):
    types = ['purchase', 'newsletter_signup', 'contact_form']
    now = timezone.now()
    for i in range(10):
        Conversion.objects.create(
            website=website,
            conversion_type=types[i % len(types)],
            name=f'Sample conversion {i+1}',
            value=((i + 1) * 9.99),
            referrer='https://google.com' if i % 2 else None,
            created_at=now - timedelta(days=i*2, hours=i*3),
        )


def main():
    user = ensure_user()
    website = ensure_website(user)
    seed_page_views(website, days=30)
    seed_conversions(website)
    print(f'Seeded analytics for user={user.username} website={website.name}')


if __name__ == '__main__':
    main()
