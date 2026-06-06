# Database Structure Documentation

## 🚀 Quick Setup Guide

### Step 1: Install PostgreSQL

```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt install postgresql postgresql-contrib
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE website_builder;

# Create user (optional)
CREATE USER website_builder_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE website_builder TO website_builder_user;

# Exit
\q
```

### Step 3: Configure Django Settings

Update `my-web-app/backend/backend/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'website_builder',
        'USER': 'postgres',  # or 'website_builder_user'
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Or use environment variable:

```python
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://postgres:password@localhost:5432/website_builder'
    )
}
```

### Step 4: Run Migrations

```bash
cd my-web-app/backend
python manage.py makemigrations
python manage.py migrate
```

### Step 5: Seed Sample Data

```bash
# Seed billing plans and templates
python manage.py seed_database

# Seed full demo data (users, websites, payments)
python manage.py seed_database --full

# Create demo user account
python manage.py createsuperuser
```

---

## Recommended Database Management System

### **Primary Recommendation: PostgreSQL**

For your website builder application, **PostgreSQL** is the recommended database management system (DBMS) for the following reasons:

| Feature | PostgreSQL Advantage |
|---------|---------------------|
| **JSON Support** | Native JSONField support for flexible data storage (tags, features) |
| **Scalability** | Excellent for handling growing user base and website data |
| **Full-Text Search** | Built-in search capabilities for template/website search |
| **Reliability** | ACID compliance for financial transactions (payments, invoices) |
| **PostGIS** | Future-proof if you need geographic features for real estate templates |
| **Django Support** | First-class Django ORM support |
| **Hosting Options** | Easy deployment on Railway, Render, Supabase, AWS RDS |

### **Alternative Options**

| DBMS | Use Case |
|------|----------|
| **MySQL** | If you need maximum compatibility with shared hosting |
| **SQLite** | Only for local development/testing |
| **Supabase** | If you want built-in auth, real-time subscriptions, and PostgreSQL |

---

## Database Schema Overview

Your application uses **Django ORM** with the following entity relationships:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION MODULE                                   │
│                                                                                      │
│  ┌─────────────────────┐                                                             │
│  │        User         │  (Django Built-in)                                          │
│  │  (auth_user)        │                                                             │
│  ├─────────────────────┤                                                             │
│  │ id (PK)             │                                                            │
│  │ username            │                                                            │
│  │ email               │                                                            │
│  │ password            │                                                            │
│  │ date_joined         │                                                            │
│  │ is_active           │                                                            │
│  └─────────┬───────────┘                                                            │
│            │                                                                         │
│            │ 1:1                                                                         │
│            ▼                                                                         │
│  ┌─────────────────────┐      1:1      ┌─────────────────────┐                        │
│  │ Subscription        │──────────────│ UserBillingPlan     │                        │
│  ├─────────────────────┤              ├─────────────────────┤                        │
│  │ id (PK)             │              │ id (PK)             │                        │
│  │ user_id (FK)        │              │ user_id (FK)        │                        │
│  │ plan                │              │ plan_id (FK)        │                        │
│  │ stripe_customer_id  │              │ has_selected_plan   │                        │
│  │ stripe_subscription │              │ selected_at         │                        │
│  │ status              │              └─────────┬───────────┘                        │
│  │ current_period_*   │                        │                                     │
│  └─────────┬───────────┘                        │                                     │
│            │                                    │                                     │
│            │ 1:N                                  │ N:1                                  │
│            ▼                                    ▼                                     │
│  ┌─────────────────────┐              ┌─────────────────────┐                        │
│  │ Payment             │              │ BillingPlan         │                        │
│  ├─────────────────────┤              ├─────────────────────┤                        │
│  │ id (UUID)           │              │ id (PK)             │                        │
│  │ user_id (FK)        │              │ name                │                        │
│  │ subscription_id(FK)│              │ slug                │                        │
│  │ amount              │◄─────────────│ price               │                        │
│  │ currency            │              │ billing_period      │                        │
│  │ payment_method      │              │ max_websites         │                        │
│  │ stripe_payment_*    │              │ features (JSON)      │                        │
│  │ status              │              │ stripe_price_id     │◄──────────────┐         │
│  └─────────┬───────────┘              └─────────┬───────────┘              │         │
│            │                                    │                           │         │
│            │ 1:1                                  │                           │         │
│            ▼                                    │                           │         │
│  ┌─────────────────────┐                        │                           │         │
│  │ Invoice             │                        │                           │         │
│  ├─────────────────────┤                        │                           │         │
│  │ id (UUID)           │                        │                           │         │
│  │ user_id (FK)        │                        │                           │         │
│  │ payment_id (FK)     │                        │                           │         │
│  │ invoice_number      │                        │                           │         │
│  │ amount_due/paid     │                        │                           │         │
│  │ status              │                        │                           │         │
│  │ stripe_invoice_id   │                        │                           │         │
│  └─────────┬───────────┘                        │                           │         │
│            │                                    │                           │         │
│            │ 1:N                                  │                           │         │
│            ▼                                    │                           │         │
│  ┌─────────────────────┐                        │                           │         │
│  │ InvoiceItem          │                        │                           │         │
│  ├─────────────────────┤                        │                           │         │
│  │ id (PK)              │                        │                           │         │
│  │ invoice_id (FK)      │                        │                           │         │
│  │ description          │                        │                           │         │
│  │ quantity             │                        │                           │         │
│  │ unit_amount          │                        │                           │         │
│  │ amount               │                        │                           │         │
│  └─────────────────────┘                        │                           │         │
│                                                  │                           │         │
│                                                  │ 1:N                         │         │
│                                                  ▼                           │         │
│                                    ┌─────────────────────┐              │         │
│                                    │ BillingPlanFeature │              │         │
│                                    ├─────────────────────┤              │         │
│                                    │ id (PK)             │              │         │
│                                    │ plan_id (FK)        │──────────────┘         │
│                                    │ feature_name        │                        │
│                                    │ feature_value       │                        │
│                                    │ is_included         │                        │
│                                    └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                TEMPLATE MODULE                                       │
│                                                                                      │
│  ┌─────────────────────┐      1:N        ┌─────────────────────┐                     │
│  │ BillingPlan         │────────────────│ Template            │                     │
│  ├─────────────────────┤  (required_plan) ├─────────────────────┤                     │
│  │ id (PK)             │                │ id (PK)             │                     │
│  │ ...                 │                │ name                │                     │
│  └─────────────────────┘                │ slug                │                     │
│                                          │ description         │                     │
│                                          │ category            │                     │
│                                          │ preview_image       │                     │
│                                          │ template_file       │                     │
│                                          │ price               │                     │
│                                          │ required_plan_id(FK)│                     │
│                                          │ tags (JSON)         │                     │
│                                          │ is_active           │                     │
│                                          └─────────┬───────────┘                     │
│                                                    │                                   │
│                                                    │ 1:N                                 │
│  ┌─────────────────────┐                          │                                     │
│  │ User                │◄─────────────────────────┘                                     │
│  ├─────────────────────┤                                                            │
│  │ (auth_user)         │                                                            │
│  │ id (PK)             │                                                            │
│  └─────────┬───────────┘                                                            │
│            │                                                                         │
│            │ 1:N                                    1:N                               │
│            ▼                                    ┌────────────┐                         │
│  ┌─────────────────────┐      1:1               │ Template   │                         │
│  │ UserTemplate        │──────────────────────│ Purchase  │                         │
│  ├─────────────────────┤                      ├────────────┤                         │
│  │ id (PK)             │                      │ id (PK)    │                         │
│  │ user_id (FK)        │                      │ user_id(FK)│                         │
│  │ template_id (FK)    │                      │ template_  │                         │
│  │ name                │                      │   id (FK)  │                         │
│  │ content             │                      │ user_temp_ │                        │
│  │ purchased_at        │                      │   id (FK)  │                        │
│  │ website_id (FK)     │                      │ amount     │                        │
│  └─────────┬───────────┘                      │ payment_   │                        │
│            │                                  │ status     │                        │
│            │ 1:1                               │ stripe_*   │                        │
│            ▼                                   └────────────┘                         │
│  ┌─────────────────────┐                                                            │
│  │ Website             │                                                            │
│  ├─────────────────────┤                                                            │
│  │ id (PK)             │                                                            │
│  │ owner_id (FK)       │                                                            │
│  │ name                │                                                            │
│  │ content             │                                                            │
│  │ created_at          │                                                            │
│  │ updated_at          │                                                            │
│  └─────────┬───────────┘                                                            │
│            │                                                                         │
│            │ N:1                                    1:N                                │
│            ▼                                    ┌────────────┐                         │
│  ┌─────────────────────┐      1:1               │ Template  │                         │
│  │ TemplateOrder       │──────────────────────│ Order    │                         │
│  ├─────────────────────┤                      ├────────────┤                         │
│  │ id (PK)             │                      │ id (PK)    │                         │
│  │ user_id (FK)        │                      │ user_id(FK)│                         │
│  │ order_type          │                      │ order_id(FK)│                        │
│  │ title               │                      │ item_type │                        │
│  │ description         │                      │ description│                        │
│  │ status              │                      │ quantity  │                        │
│  │ quoted_price        │                      │ unit_price│                        │
│  │ invoice_id (FK)     │                      └────────────┘                         │
│  │ delivered_template_ │                                                           │
│  │   id (FK)           │                                                           │
│  │ notes               │                                                           │
│  └─────────────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Table-by-Table Breakdown

### 1. **User** (Django Built-in: `auth_user`)
| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| username | String | Unique username |
| email | String | User email |
| password | String | Hashed password |
| date_joined | DateTime | Registration date |
| is_active | Boolean | Account status |

---

### 2. **Subscription**
Links users to their subscription plans with Stripe integration.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| user_id | Integer (FK) | References `auth_user.id` |
| plan | String | 'free', 'premium', 'business' |
| stripe_customer_id | String | Stripe customer identifier |
| stripe_subscription_id | String | Stripe subscription ID |
| status | String | 'active', 'cancelled', 'past_due' |
| current_period_start | DateTime | Subscription period start |
| current_period_end | DateTime | Subscription period end |

**Relationships:**
- **1:1 with User** - Each user has one subscription
- **1:N with Payment** - A subscription can have multiple payments

---

### 3. **BillingPlan**
Defines available subscription tiers.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| name | String | Plan name (e.g., "Basic") |
| slug | String | URL-friendly identifier |
| price | Decimal | Monthly/yearly price |
| billing_period | String | 'monthly' or 'yearly' |
| max_websites | Integer | Number of websites allowed |
| max_templates_access | Integer | Templates access (-1 = all) |
| can_use_custom_domain | Boolean | Custom domain feature |
| can_remove_branding | Boolean | Remove watermark |
| can_access_api | Boolean | API access |
| can_have_team_members | Boolean | Team collaboration |
| max_team_members | Integer | Team size limit |
| has_priority_support | Boolean | Priority support |
| has_analytics | Boolean | Analytics access |
| has_white_label | Boolean | White-label feature |
| can_order_custom_template | Boolean | Custom template orders |
| stripe_price_id | String | Stripe price identifier |

**Relationships:**
- **1:N with BillingPlanFeature** - Features per plan
- **1:N with Template** - Templates included in plan
- **1:N with UserBillingPlan** - Users subscribed to plan

---

### 4. **UserBillingPlan**
Tracks user's selected billing plan.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| user_id | Integer (FK) | References `auth_user.id` |
| plan_id | Integer (FK) | References `BillingPlan.id` |
| has_selected_plan | Boolean | Plan selection status |
| selected_at | DateTime | When plan was selected |

**Relationships:**
- **1:1 with User** - One plan selection per user
- **N:1 with BillingPlan** - References the selected plan

---

### 5. **BillingPlanFeature**
Detailed features for each billing plan.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| plan_id | Integer (FK) | References `BillingPlan.id` |
| feature_name | String | Feature identifier |
| feature_value | String | Feature value |
| is_included | Boolean | Whether included |

**Relationships:**
- **N:1 with BillingPlan** - Each feature belongs to a plan

---

### 6. **Template**
Available website templates.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| name | String | Template name |
| slug | String | URL-friendly identifier |
| description | Text | Template description |
| category | String | Template category |
| preview_image | URL | Preview image URL |
| template_file | Text | HTML/CSS/JS content |
| price | Decimal | Template price |
| is_free | Boolean | Free template flag |
| is_premium | Boolean | Premium template flag |
| required_plan_id | Integer (FK) | Plan required for access |
| tags | JSON | Array of tags |

**Relationships:**
- **N:1 with BillingPlan** - Required plan to access
- **1:N with UserTemplate** - Copies made by users
- **1:N with TemplatePurchase** - Purchase records

---

### 7. **UserTemplate**
User's purchased/copied template instances.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| user_id | Integer (FK) | References `auth_user.id` |
| template_id | Integer (FK) | References `Template.id` |
| name | String | Customized name |
| content | Text | Customized template content |
| purchased_at | DateTime | Purchase timestamp |
| website_id | Integer (FK) | Associated website (nullable) |

**Relationships:**
- **N:1 with User** - Template copies per user
- **N:1 with Template** - Source template
- **1:1 with Website** - Linked website (optional)

---

### 8. **TemplatePurchase**
Records of template purchases.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| user_id | Integer (FK) | References `auth_user.id` |
| template_id | Integer (FK) | References `Template.id` |
| user_template_id | Integer (FK) | Created UserTemplate |
| amount | Decimal | Purchase amount |
| payment_status | String | 'pending', 'completed', etc. |
| stripe_payment_id | String | Stripe payment reference |
| created_at | DateTime | Purchase timestamp |

**Relationships:**
- **N:1 with User** - User who made purchase
- **N:1 with Template** - Purchased template
- **1:1 with UserTemplate** - Resulting template copy

---

### 9. **TemplateOrder**
Custom template orders.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| user_id | Integer (FK) | References `auth_user.id` |
| order_type | String | 'custom_design', etc. |
| title | String | Order title |
| description | Text | Requirements |
| requirements | Text | Detailed requirements |
| status | String | Order status |
| quoted_price | Decimal | Quoted price |
| invoice_id | Integer (FK) | Associated invoice |
| delivered_template_id | Integer (FK) | Delivered template |
| notes | Text | Additional notes |

**Relationships:**
- **N:1 with User** - User who placed order
- **1:1 with Invoice** - Associated invoice
- **N:1 with Template** - Delivered template

---

### 10. **Payment**
All payment records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | Integer (FK) | References `auth_user.id` |
| subscription_id | Integer (FK) | Related subscription |
| amount | Decimal | Payment amount |
| currency | String | Currency code |
| payment_method | String | 'card', 'mobile_money' |
| mobile_network | String | 'orange', 'mtn' |
| phone_number | String | Mobile payment number |
| stripe_payment_intent_id | String | Stripe PaymentIntent |
| stripe_charge_id | String | Stripe charge ID |
| status | String | 'pending', 'completed', etc. |
| description | Text | Payment description |

**Relationships:**
- **N:1 with User** - User who made payment
- **N:1 with Subscription** - Related subscription
- **1:1 with Invoice** - Generated invoice

---

### 11. **Invoice**
Billing invoices.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | Integer (FK) | References `auth_user.id` |
| payment_id | Integer (FK) | Related payment |
| invoice_number | String | Unique invoice number |
| amount_due | Decimal | Total amount due |
| amount_paid | Decimal | Amount paid |
| currency | String | Currency code |
| status | String | 'draft', 'paid', etc. |
| description | Text | Invoice description |
| due_date | DateTime | Payment due date |
| paid_at | DateTime | When paid |
| stripe_invoice_id | String | Stripe invoice ID |
| invoice_pdf_url | URL | PDF download URL |

**Relationships:**
- **N:1 with User** - Invoice owner
- **1:1 with Payment** - Related payment
- **1:N with InvoiceItem** - Line items
- **1:1 with TemplateOrder** - Template order invoice

---

### 12. **InvoiceItem**
Line items on invoices.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| invoice_id | Integer (FK) | References `Invoice.id` |
| description | String | Item description |
| quantity | Integer | Item quantity |
| unit_amount | Decimal | Price per unit |
| amount | Decimal | Total line amount |

**Relationships:**
- **N:1 with Invoice** - Parent invoice

---

### 13. **Website**
User-created websites.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Primary key |
| owner_id | Integer (FK) | References `auth_user.id` |
| name | String | Website name |
| content | Text | Website content/HTML |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update |

**Relationships:**
- **N:1 with User** - Website owner
- **1:1 with UserTemplate** - Source template

---

## Indexing Recommendations

For optimal performance, add these indexes to your models:

```python
# In models.py - add to each model's Meta class:

class Subscription(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['stripe_subscription_id']),
        ]

class Payment(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['stripe_payment_intent_id']),
            models.Index(fields=['created_at']),
        ]

class Template(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['price', 'is_free']),
            models.Index(fields=['slug']),
        ]

class Website(models.Model):
    # ... fields ...
    
    class Meta:
        indexes = [
            models.Index(fields=['owner', 'created_at']),
        ]
```

---

## Database Configuration for Production

### PostgreSQL Settings (`settings.py`)

```python
import dj_database_url

# Production database configuration
DATABASES = {
    'default': dj_database_url.config(
        default='postgresql://user:password@localhost:5432/website_builder',
        conn_max_age=600,
        ssl_require=True
    )
}

# Alternative: Manual PostgreSQL config
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'website_builder',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}
```

### Environment Variables (.env)

```
DATABASE_URL=postgresql://user:password@host:5432/website_builder
```

---

## Migration Strategy

When making model changes:

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create a new migration for specific app
python manage.py makemigrations core

# Show migration status
python manage.py showmigrations

# Fake migration if needed (use with caution)
python manage.py migrate core --fake
```

---

## Summary

| Module | Tables | Primary Purpose |
|--------|--------|-----------------|
| **Auth** | User | User authentication |
| **Billing** | BillingPlan, BillingPlanFeature, UserBillingPlan | Plan management |
| **Subscription** | Subscription | Subscription tracking |
| **Payments** | Payment, Invoice, InvoiceItem | Payment processing |
| **Templates** | Template, UserTemplate, TemplatePurchase | Template system |
| **Orders** | TemplateOrder | Custom template orders |
| **Websites** | Website | User website management |

**Total: 13 tables** (excluding Django's built-in tables)

---

## Recommended Add-ons

1. **django-redis** - For caching
2. **django-celery-beat** - For scheduled tasks
3. **django-cors-headers** - For API CORS
4. **django-filter** - For advanced querying
5. **django-cachalot** - For automatic query caching
