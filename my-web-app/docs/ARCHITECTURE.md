# WaaS Platform - Production Architecture Blueprint

## Executive Summary

Your platform has solid foundations but needs structural reorganization for production scale. Here's my comprehensive improvement plan.

---

## 1. Current State Analysis

### What's Working Well
- JWT Authentication with refresh tokens
- Template system with JSON structure
- ZIP upload with security (zip slip protection)
- Stripe integration
- Team collaboration features
- Media gallery

### Issues to Address
- Monolithic `core` app (1000+ lines models.py)
- Mixed concerns in views
- No API versioning
- Limited database optimization
- Missing caching layer
- No async processing for heavy tasks

---

## 2. Recommended Architecture

### Modular App Structure

```
backend/
├── apps/
│   ├── accounts/          # Authentication, profiles, sessions
│   ├── billing/          # Plans, subscriptions, invoices, payments
│   ├── websites/          # Website CRUD, publishing, domains
│   ├── builder/          # Page elements, templates, JSON structures
│   ├── uploads/          # ZIP uploads, media gallery
│   └── teams/            # Team collaboration
├── common/               # Shared utilities, decorators, middleware
├── config/               # Django settings (split for environment)
└── manage.py
```

### Module Responsibilities

| Module | Purpose | Key Models |
|--------|---------|------------|
| `accounts` | User auth, profiles, sessions, 2FA | User, UserProfile, UserSession, TwoFactorAuth |
| `billing` | Plans, subscriptions, payments, invoices | BillingPlan, Subscription, Payment, Invoice |
| `websites` | Website management, publishing, domains | Website, Domain |
| `builder` | Page elements, templates, JSON structures | Template, UserTemplate, PageElement |
| `uploads` | ZIP uploads, media files | CustomWebsiteUpload, MediaImage, WebsiteTemplateJSON |
| `teams` | Team memberships and permissions | TeamMember |

---

## 3. API Restructuring

### Versioned API Structure

```
/api/v1/
├── /auth/
│   ├── POST /register/
│   ├── POST /login/
│   ├── POST /logout/
│   ├── POST /refresh/
│   ├── POST /password-reset/
│   ├── POST /verify-email/
│   └── GET  /me/
│
├── /billing/
│   ├── GET    /plans/
│   ├── GET    /subscription/
│   ├── POST   /subscribe/
│   ├── DELETE /subscription/
│   ├── GET    /invoices/
│   └── GET    /invoices/{id}/
│
├── /websites/
│   ├── GET    /                     # List user's websites
│   ├── POST   /                     # Create website
│   ├── GET    /{id}/                # Get website details
│   ├── PUT    /{id}/                # Update website
│   ├── DELETE /{id}/                # Delete website
│   ├── POST   /{id}/publish/       # Publish website
│   ├── POST   /{id}/unpublish/     # Unpublish website
│   ├── GET    /{id}/preview/       # Get preview URL
│   └── GET    /{id}/team/          # Team management
│
├── /builder/
│   ├── GET    /templates/           # Browse templates
│   ├── GET    /templates/{slug}/    # Template details
│   ├── POST   /templates/{slug}/use/ # Use template
│   ├── GET    /{website_id}/elements/ # Page elements
│   ├── POST   /{website_id}/elements/ # Add element
│   └── PUT    /{website_id}/elements/{id}/ # Update element
│
├── /uploads/
│   ├── POST   /zip/                 # Upload ZIP
│   ├── GET    /zip/                 # List uploads
│   ├── GET    /zip/{id}/            # Get upload status
│   ├── POST   /zip/{id}/convert/   # Convert to template
│   └── POST   /zip/{id}/publish/   # Publish
│
└── /media/
    ├── GET    /                     # List images
    ├── POST   /                     # Upload image
    └── DELETE /{id}/                 # Delete image
```

### API Best Practices
- Use API versioning (`/api/v1/`)
- Implement pagination on all list endpoints
- Add rate limiting per user tier
- Use problem RFC 7807 for error responses

---

## 4. Database Improvements

### Index Optimization

```python
# Add to existing models
class Meta:
    indexes = [
        # Website - common queries
        models.Index(fields=['owner', 'status']),
        models.Index(fields=['owner', '-created_at']),
        models.Index(fields=['slug', 'is_published']),
        
        # Template - browse queries  
        models.Index(fields=['category', 'is_active', 'is_free']),
        models.Index(fields=['-rating']),
        
        # Billing - performance
        models.Index(fields=['user', 'status']),  # for subscriptions
        models.Index(fields=['user', '-created_at']),  # for invoices
    ]
```

### Recommended Additions

1. **Composite indexes** for common filter combinations
2. **Partial indexes** for published websites only
3. **Database connection pooling** (use `django-db-geventpool` or pgbouncer)

### PostgreSQL-Specific Optimizations

```sql
-- Enable JSONB operations
ALTER TABLE core_website ADD COLUMN IF NOT EXISTS element_data JSONB;

-- Create GIN index for JSON queries
CREATE INDEX idx_website_element_data ON core_website USING GIN(element_data);

-- Partition large tables (invoices, logs)
CREATE TABLE app_log PARTITION BY RANGE (created_at);
```

---

## 5. Scalability Improvements

### Caching Strategy

| Layer | Technology | What to Cache |
|-------|------------|---------------|
| CDN | CloudFlare | Static assets, published websites |
| Redis | django-redis | Template list, user sessions, API responses |
| DB | Query optimization | Repeated queries |

```python
# settings.py

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Template cache (1 hour)
@cache_page(60 * 60, key_prefix='templates')
def TemplateListView(...):
    ...

# User session cache
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### Async Processing

For heavy operations, use Celery:

```python
# tasks.py
from celery import shared_task

@shared_task
def extract_zip_async(upload_id):
    """Process ZIP extraction in background"""
    upload = CustomWebsiteUpload.objects.get(id=upload_id)
    # extraction logic
    upload.status = 'ready'
    upload.save()

@shared_task  
def convert_html_to_template(upload_id):
    """Convert HTML to JSON in background"""
    ...

@shared_task
def publish_website_task(website_id):
    """Publish website with CDN invalidation"""
    ...
```

### File Storage (Production)

```python
# settings.py - Use S3/CloudFlare R2

DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_S3_BUCKET_NAME = os.getenv('AWS_S3_BUCKET')
AWS_S3_REGION_NAME = os.getenv('AWS_REGION')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_S3_BUCKET}.s3.amazonaws.com'

# Media files
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
```

---

## 6. Security Hardening

### Authentication

```python
# settings.py

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Short access token
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Rate Limiting
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'upload': '10/hour',
    }
}
```

### Additional Security Headers

```python
# middleware.py
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Content-Security-Policy'] = "default-src 'self'"
        return response
```

---

## 7. Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Split into modular apps
- [ ] Set up API versioning
- [ ] Add Redis caching
- [ ] Configure S3 file storage

### Phase 2: Performance (Week 3-4)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Implement Celery for async tasks
- [ ] Set up CDN for static assets

### Phase 3: Security (Week 5-6)
- [ ] Security audit
- [ ] Rate limiting
- [ ] 2FA enforcement
- [ ] Audit logging

### Phase 4: Scale (Week 7-8)
- [ ] Load testing
- [ ] Auto-scaling configuration
- [ ] Monitoring (Sentry + Prometheus)
- [ ] Documentation

---

## 8. Quick Wins (Implement Now)

### 1. Add Simple Pagination
```python
# rest_framework pagination
class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

### 2. Add API Response Wrapper
```python
# common/responses.py
def api_response(data=None, message=None, success=True, status=200):
    return Response({
        'success': success,
        'message': message,
        'data': data,
        'timestamp': timezone.now().isoformat()
    }, status=status)
```

### 3. Add Request Logging Middleware
```python
# Track slow requests
class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = time.time() - start
        
        if duration > 1.0:  # Log slow requests
            logger.warning(f'Slow request: {request.path} took {duration}s')
        
        return response
```

---

## Summary

Your platform has excellent features. The main improvements needed are:

1. **Modular Structure** - Split monolithic app into focused modules
2. **API Versioning** - Add `/api/v1/` prefix
3. **Caching** - Add Redis for performance
4. **Async Tasks** - Use Celery for ZIP processing
5. **Production Storage** - Move to S3/CloudFlare R2
6. **Security** - Rate limiting, audit logging

This architecture will scale from 100 to 100,000+ users with minimal changes.
