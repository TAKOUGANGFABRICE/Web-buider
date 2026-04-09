-- Website Builder Database Schema
-- PostgreSQL 16+
-- Generated for Django ORM compatibility

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AUTHENTICATION TABLES (Django Built-in)
-- ============================================

-- Users table (from Django auth)
CREATE TABLE IF NOT EXISTS auth_user (
    id SERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL DEFAULT '',
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL DEFAULT '',
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS auth_user_username_idx ON auth_user (username);
CREATE INDEX IF NOT EXISTS auth_user_email_idx ON auth_user (email);

-- User Profile (Extended user data)
CREATE TABLE IF NOT EXISTS core_userprofile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES auth_user(id) ON DELETE CASCADE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(255) NOT NULL DEFAULT '',
    password_reset_token VARCHAR(255) NOT NULL DEFAULT '',
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    google_id VARCHAR(255),
    facebook_id VARCHAR(255),
    avatar VARCHAR(500),
    phone VARCHAR(20) NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    date_of_birth DATE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_userprofile_user_id_idx ON core_userprofile (user_id);
CREATE INDEX IF NOT EXISTS core_userprofile_email_verification_token_idx ON core_userprofile (email_verification_token);
CREATE INDEX IF NOT EXISTS core_userprofile_password_reset_token_idx ON core_userprofile (password_reset_token);

-- ============================================
-- BILLING MODULE
-- ============================================

-- Billing Plans
CREATE TABLE IF NOT EXISTS core_billingplan (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
    description TEXT NOT NULL DEFAULT '',
    max_websites INTEGER NOT NULL DEFAULT 1,
    max_templates_access INTEGER NOT NULL DEFAULT 0,
    can_use_custom_domain BOOLEAN NOT NULL DEFAULT FALSE,
    can_remove_branding BOOLEAN NOT NULL DEFAULT FALSE,
    can_access_api BOOLEAN NOT NULL DEFAULT FALSE,
    can_have_team_members BOOLEAN NOT NULL DEFAULT FALSE,
    max_team_members INTEGER NOT NULL DEFAULT 0,
    has_priority_support BOOLEAN NOT NULL DEFAULT FALSE,
    has_analytics BOOLEAN NOT NULL DEFAULT FALSE,
    has_white_label BOOLEAN NOT NULL DEFAULT FALSE,
    can_order_custom_template BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    stripe_price_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_billingplan_slug_idx ON core_billingplan (slug);
CREATE INDEX IF NOT EXISTS core_billingplan_price_idx ON core_billingplan (price);
CREATE INDEX IF NOT EXISTS core_billingplan_is_active_idx ON core_billingplan (is_active);

-- Billing Plan Features
CREATE TABLE IF NOT EXISTS core_billingplanfeature (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES core_billingplan(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    is_included BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS core_billingplanfeature_plan_id_idx ON core_billingplanfeature (plan_id);

-- User Billing Plans (Selected plan after signup)
CREATE TABLE IF NOT EXISTS core_userbillingplan (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES auth_user(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES core_billingplan(id) ON DELETE SET NULL,
    has_selected_plan BOOLEAN NOT NULL DEFAULT FALSE,
    selected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_userbillingplan_user_id_idx ON core_userbillingplan (user_id);
CREATE INDEX IF NOT EXISTS core_userbillingplan_plan_id_idx ON core_userbillingplan (plan_id);

-- ============================================
-- SUBSCRIPTION MODULE
-- ============================================

-- Subscriptions
CREATE TABLE IF NOT EXISTS core_subscription (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES auth_user(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_subscription_user_id_idx ON core_subscription (user_id);
CREATE INDEX IF NOT EXISTS core_subscription_status_idx ON core_subscription (status);
CREATE INDEX IF NOT EXISTS core_subscription_stripe_customer_idx ON core_subscription (stripe_customer_id);
CREATE INDEX IF NOT EXISTS core_subscription_stripe_subscription_idx ON core_subscription (stripe_subscription_id);

-- ============================================
-- PAYMENT MODULE
-- ============================================

-- Payments
CREATE TABLE IF NOT EXISTS core_payment (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES core_subscription(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(20) NOT NULL,
    mobile_network VARCHAR(20),
    phone_number VARCHAR(20),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS core_payment_user_id_idx ON core_payment (user_id);
CREATE INDEX IF NOT EXISTS core_payment_subscription_id_idx ON core_payment (subscription_id);
CREATE INDEX IF NOT EXISTS core_payment_status_idx ON core_payment (status);
CREATE INDEX IF NOT EXISTS core_payment_created_at_idx ON core_payment (created_at);
CREATE INDEX IF NOT EXISTS core_payment_stripe_payment_intent_idx ON core_payment (stripe_payment_intent_id);

-- ============================================
-- INVOICE MODULE
-- ============================================

-- Invoices
CREATE TABLE IF NOT EXISTS core_invoice (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    payment_id UUID UNIQUE REFERENCES core_payment(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    description TEXT NOT NULL DEFAULT '',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    stripe_invoice_id VARCHAR(255),
    invoice_pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS core_invoice_user_id_idx ON core_invoice (user_id);
CREATE INDEX IF NOT EXISTS core_invoice_status_idx ON core_invoice (status);
CREATE INDEX IF NOT EXISTS core_invoice_invoice_number_idx ON core_invoice (invoice_number);
CREATE INDEX IF NOT EXISTS core_invoice_created_at_idx ON core_invoice (created_at);

-- Invoice Items
CREATE TABLE IF NOT EXISTS core_invoiceitem (
    id SERIAL PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES core_invoice(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_amount DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS core_invoiceitem_invoice_id_idx ON core_invoiceitem (invoice_id);

-- ============================================
-- TEMPLATE MODULE
-- ============================================

-- Templates
CREATE TABLE IF NOT EXISTS core_template (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    preview_image VARCHAR(500) NOT NULL DEFAULT '',
    template_file TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT FALSE,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    required_plan_id INTEGER REFERENCES core_billingplan(id) ON DELETE SET NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_template_slug_idx ON core_template (slug);
CREATE INDEX IF NOT EXISTS core_template_category_idx ON core_template (category);
CREATE INDEX IF NOT EXISTS core_template_is_active_idx ON core_template (is_active);
CREATE INDEX IF NOT EXISTS core_template_price_idx ON core_template (price);
CREATE INDEX IF NOT EXISTS core_template_created_at_idx ON core_template (created_at);
CREATE INDEX IF NOT EXISTS core_template_category_active_idx ON core_template (category, is_active);

-- User Templates (Purchased/Copied Templates)
CREATE TABLE IF NOT EXISTS core_usertemplate (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES core_template(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    website_id INTEGER UNIQUE REFERENCES core_website(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS core_usertemplate_user_id_idx ON core_usertemplate (user_id);
CREATE INDEX IF NOT EXISTS core_usertemplate_template_id_idx ON core_usertemplate (template_id);
CREATE INDEX IF NOT EXISTS core_usertemplate_purchased_at_idx ON core_usertemplate (purchased_at);

-- Template Purchases
CREATE TABLE IF NOT EXISTS core_templatepurchase (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES core_template(id) ON DELETE CASCADE,
    user_template_id INTEGER UNIQUE REFERENCES core_usertemplate(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_templatepurchase_user_id_idx ON core_templatepurchase (user_id);
CREATE INDEX IF NOT EXISTS core_templatepurchase_template_id_idx ON core_templatepurchase (template_id);
CREATE INDEX IF NOT EXISTS core_templatepurchase_payment_status_idx ON core_templatepurchase (payment_status);

-- ============================================
-- WEBSITE MODULE
-- ============================================

-- Websites (must be before core_usertemplate)
CREATE TABLE IF NOT EXISTS core_website (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    subdomain VARCHAR(100),
    custom_domain VARCHAR(255),
    template_used_id INTEGER REFERENCES core_template(id) ON DELETE SET NULL,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    seo_title VARCHAR(200) NOT NULL DEFAULT '',
    seo_description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_website_owner_id_idx ON core_website (owner_id);
CREATE INDEX IF NOT EXISTS core_website_created_at_idx ON core_website (created_at);

-- ============================================
-- TEMPLATE ORDER MODULE
-- ============================================

-- Template Orders
CREATE TABLE IF NOT EXISTS core_templateorder (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    order_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    quoted_price DECIMAL(10, 2),
    invoice_id UUID UNIQUE REFERENCES core_invoice(id) ON DELETE SET NULL,
    delivered_template_id INTEGER REFERENCES core_template(id) ON DELETE SET NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_templateorder_user_id_idx ON core_templateorder (user_id);
CREATE INDEX IF NOT EXISTS core_templateorder_status_idx ON core_templateorder (status);
CREATE INDEX IF NOT EXISTS core_templateorder_created_at_idx ON core_templateorder (created_at);

-- ============================================
-- ADDITIONAL TABLES FOR FUTURE FEATURES
-- ============================================

-- Team Members (for team collaboration)
CREATE TABLE IF NOT EXISTS core_teammember (
    id SERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES core_website(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'editor',
    invited_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(website_id, user_id)
);

CREATE INDEX IF NOT EXISTS core_teammember_website_id_idx ON core_teammember (website_id);
CREATE INDEX IF NOT EXISTS core_teammember_user_id_idx ON core_teammember (user_id);

-- Custom Domains
CREATE TABLE IF NOT EXISTS core_domain (
    id SERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES core_website(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code VARCHAR(100),
    verification_record VARCHAR(100),
    ssl_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ssl_cert_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
);

CREATE INDEX IF NOT EXISTS core_domain_website_id_idx ON core_domain (website_id);
CREATE INDEX IF NOT EXISTS core_domain_domain_idx ON core_domain (domain);

-- Page Builder Elements
CREATE TABLE IF NOT EXISTS core_pageelement (
    id SERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES core_website(id) ON DELETE CASCADE,
    page_name VARCHAR(100) NOT NULL DEFAULT 'index',
    element_type VARCHAR(50) NOT NULL,
    element_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    position INTEGER NOT NULL DEFAULT 0,
    parent_id INTEGER REFERENCES core_pageelement(id) ON DELETE CASCADE,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_pageelement_website_id_idx ON core_pageelement (website_id);
CREATE INDEX IF NOT EXISTS core_pageelement_page_name_idx ON core_pageelement (page_name);

-- Website Analytics
CREATE TABLE IF NOT EXISTS core_pageview (
    id BIGSERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES core_website(id) ON DELETE CASCADE,
    page_url VARCHAR(500) NOT NULL,
    visitor_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    country VARCHAR(50),
    city VARCHAR(100),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS core_pageview_website_id_idx ON core_pageview (website_id);
CREATE INDEX IF NOT EXISTS core_pageview_viewed_at_idx ON core_pageview (viewed_at);

-- ============================================
-- SEQUENCES FOR AUTO-INCREMENT
-- ============================================

CREATE SEQUENCE IF NOT EXISTS auth_user_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_userprofile_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_billingplan_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_billingplanfeature_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_userbillingplan_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_subscription_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_payment_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_invoice_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_invoiceitem_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_template_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_usertemplate_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_templatepurchase_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_templateorder_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_website_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_teammember_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_domain_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_pageelement_id_seq;
CREATE SEQUENCE IF NOT EXISTS core_pageview_id_seq;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE core_billingplan IS 'Available subscription plans with features';
COMMENT ON TABLE core_billingplanfeature IS 'Detailed features for each billing plan';
COMMENT ON TABLE core_userbillingplan IS 'Tracks user plan selection after signup';
COMMENT ON TABLE core_subscription IS 'User subscriptions linked to Stripe';
COMMENT ON TABLE core_payment IS 'All payment records including mobile money';
COMMENT ON TABLE core_invoice IS 'Billing invoices for users';
COMMENT ON TABLE core_invoiceitem IS 'Line items on invoices';
COMMENT ON TABLE core_template IS 'Available website templates';
COMMENT ON TABLE core_usertemplate IS 'User purchased/copied templates';
COMMENT ON TABLE core_templatepurchase IS 'Template purchase records';
COMMENT ON TABLE core_templateorder IS 'Custom template order requests';
COMMENT ON TABLE core_website IS 'User created websites';
COMMENT ON TABLE core_teammember IS 'Team collaboration on websites';
COMMENT ON TABLE core_domain IS 'Custom domains for websites';
COMMENT ON TABLE core_pageelement IS 'Page builder elements for websites';
COMMENT ON TABLE core_pageview IS 'Website analytics page views';

-- ============================================
-- FINAL SUMMARY
-- ============================================

-- Total Tables: 16 tables (excluding Django internal tables)
-- Total Indexes: 35+ indexes for optimal query performance

-- ============================================
-- AUTHENTICATION SQL QUERIES
-- ============================================

-- -----------------------------
-- SIGNUP / REGISTER QUERIES
-- -----------------------------

-- Step 1: Create new user (returns id, username, email)
INSERT INTO auth_user (
    password,
    username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined
) VALUES (
    $1, -- password (hashed)
    $2, -- username
    $3, -- first_name
    $4, -- last_name
    $5, -- email
    FALSE,
    TRUE,
    CURRENT_TIMESTAMP
)
RETURNING id;

-- Step 2: Create user profile using the returned user_id as $1
INSERT INTO core_userprofile (
    user_id,
    is_email_verified,
    email_verification_token,
    created_at,
    updated_at
) VALUES (
    $1, -- user_id (from Step 1 RETURNING)
    FALSE,
    $2, -- email_verification_token
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 3: Create user billing plan (no plan selected yet)
INSERT INTO core_userbillingplan (
    user_id,
    has_selected_plan,
    created_at,
    updated_at
) VALUES (
    $1, -- user_id
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 4: Create default subscription
INSERT INTO core_subscription (
    user_id,
    plan,
    status,
    created_at,
    updated_at
) VALUES (
    $1, -- user_id
    'free',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- -----------------------------
-- LOGIN QUERIES
-- -----------------------------

-- Authenticate user by username
SELECT 
    id,
    username,
    password,
    email,
    first_name,
    last_name,
    is_active,
    is_staff,
    last_login,
    date_joined
FROM auth_user 
WHERE username = $1;

-- Get user profile for authenticated user
SELECT 
    up.id,
    up.user_id,
    up.is_email_verified,
    up.google_id,
    up.facebook_id,
    up.avatar,
    up.phone,
    up.bio,
    u.username,
    u.email,
    u.first_name,
    u.last_name
FROM core_userprofile up
JOIN auth_user u ON u.id = up.user_id
WHERE up.user_id = $1;

-- -----------------------------
-- EMAIL VERIFICATION
-- -----------------------------

-- Verify email by token
UPDATE core_userprofile 
SET is_email_verified = TRUE,
    email_verification_token = '',
    updated_at = CURRENT_TIMESTAMP
WHERE email_verification_token = $1
RETURNING user_id;

-- -----------------------------
-- PASSWORD RESET
-- -----------------------------

-- Request password reset (generate token)
UPDATE core_userprofile 
SET password_reset_token = $1, -- token
    password_reset_expires = CURRENT_TIMESTAMP + INTERVAL '24 hours',
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $2
RETURNING user_id;

-- Verify password reset token
SELECT 
    user_id,
    password_reset_token,
    password_reset_expires
FROM core_userprofile 
WHERE password_reset_token = $1 
    AND password_reset_expires > CURRENT_TIMESTAMP;

-- Reset password
UPDATE auth_user 
SET password = $1 -- new hashed password
WHERE id = $2; -- user_id

-- Clear password reset token after successful reset
UPDATE core_userprofile 
SET password_reset_token = '',
    password_reset_expires = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $1;

-- -----------------------------
-- SOCIAL LOGIN
-- -----------------------------

-- Link Google account to user profile
UPDATE core_userprofile 
SET google_id = $1, -- google_id
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $2;

-- Link Facebook account to user profile
UPDATE core_userprofile 
SET facebook_id = $1, -- facebook_id
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $2;

-- Find user by Google ID
SELECT 
    u.id,
    u.username,
    u.email,
    u.password,
    up.is_email_verified
FROM auth_user u
JOIN core_userprofile up ON up.user_id = u.id
WHERE up.google_id = $1;

-- Find user by Facebook ID
SELECT 
    u.id,
    u.username,
    u.email,
    u.password,
    up.is_email_verified
FROM auth_user u
JOIN core_userprofile up ON up.user_id = u.id
WHERE up.facebook_id = $1;

-- -----------------------------
-- UPDATE PROFILE
-- -----------------------------

-- Update user profile (partial update - use COALESCE to keep existing values if NULL)
UPDATE core_userprofile 
SET 
    avatar = COALESCE(NULLIF($1, ''), avatar),
    phone = COALESCE(NULLIF($2, ''), phone),
    bio = COALESCE(NULLIF($3, ''), bio),
    date_of_birth = $4,
    email_notifications = COALESCE($5, email_notifications),
    marketing_emails = COALESCE($6, marketing_emails),
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $7;

-- Update auth user details (partial update - use COALESCE to keep existing values if empty)
UPDATE auth_user 
SET 
    first_name = COALESCE(NULLIF($1, ''), first_name),
    last_name = COALESCE(NULLIF($2, ''), last_name),
    email = COALESCE(NULLIF($3, ''), email)
WHERE id = $4;

-- -----------------------------
-- SESSION MANAGEMENT
-- -----------------------------

-- Update last login
UPDATE auth_user 
SET last_login = CURRENT_TIMESTAMP
WHERE id = $1;

-- Get user with subscription info
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    up.is_email_verified,
    up.avatar,
    s.plan AS subscription_plan,
    s.status AS subscription_status
FROM auth_user u
LEFT JOIN core_userprofile up ON up.user_id = u.id
LEFT JOIN core_subscription s ON s.user_id = u.id
WHERE u.id = $1;

-- -----------------------------
-- VALIDATION QUERIES
-- -----------------------------

-- Check if username exists
SELECT EXISTS(SELECT 1 FROM auth_user WHERE username = $1) AS exists;

-- Check if email exists
SELECT EXISTS(SELECT 1 FROM auth_user WHERE email = $1) AS exists;

-- Get user by email (for password reset)
SELECT 
    u.id,
    u.username,
    u.email,
    up.password_reset_token,
    up.password_reset_expires
FROM auth_user u
JOIN core_userprofile up ON up.user_id = u.id
WHERE u.email = $1;

-- -----------------------------
-- ACCOUNT MANAGEMENT
-- -----------------------------

-- Deactivate user account
UPDATE auth_user 
SET is_active = FALSE
WHERE id = $1;

-- Reactivate user account
UPDATE auth_user 
SET is_active = TRUE
WHERE id = $1;

-- Delete user account (cascade will delete profile)
DELETE FROM auth_user WHERE id = $1;

-- -----------------------------
-- COMPLETE USER PROFILE
-- -----------------------------

-- Get complete user profile with billing info
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.date_joined,
    u.last_login,
    up.is_email_verified,
    up.avatar,
    up.phone,
    up.bio,
    up.date_of_birth,
    up.email_notifications,
    up.marketing_emails,
    bp.plan_id AS billing_plan_id,
    bp.has_selected_plan,
    s.plan AS subscription_plan,
    s.status AS subscription_status
FROM auth_user u
LEFT JOIN core_userprofile up ON up.user_id = u.id
LEFT JOIN core_userbillingplan bp ON bp.user_id = u.id
LEFT JOIN core_subscription s ON s.user_id = u.id
WHERE u.id = $1;

-- ============================================
-- BILLING PLAN SQL QUERIES
-- ============================================

-- -----------------------------
-- BILLING PLAN QUERIES
-- -----------------------------

-- Create new billing plan
INSERT INTO core_billingplan (
    name,
    slug,
    price,
    billing_period,
    description,
    max_websites,
    max_templates_access,
    can_use_custom_domain,
    can_remove_branding,
    can_access_api,
    can_have_team_members,
    max_team_members,
    has_priority_support,
    has_analytics,
    has_white_label,
    can_order_custom_template,
    is_active,
    stripe_price_id,
    created_at,
    updated_at
) VALUES (
    $1,  -- name
    $2,  -- slug
    $3,  -- price
    $4,  -- billing_period
    $5,  -- description
    $6,  -- max_websites
    $7,  -- max_templates_access
    $8,  -- can_use_custom_domain
    $9,  -- can_remove_branding
    $10, -- can_access_api
    $11, -- can_have_team_members
    $12, -- max_team_members
    $13, -- has_priority_support
    $14, -- has_analytics
    $15, -- has_white_label
    $16, -- can_order_custom_template
    $17, -- is_active
    $18, -- stripe_price_id
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, name, slug, price;

-- Get all active billing plans
SELECT 
    id,
    name,
    slug,
    price,
    billing_period,
    description,
    max_websites,
    max_templates_access,
    can_use_custom_domain,
    can_remove_branding,
    can_access_api,
    can_have_team_members,
    max_team_members,
    has_priority_support,
    has_analytics,
    has_white_label,
    can_order_custom_template,
    is_active,
    stripe_price_id,
    created_at
FROM core_billingplan 
WHERE is_active = TRUE
ORDER BY price;

-- Get single billing plan by ID
SELECT * FROM core_billingplan WHERE id = $1;

-- Get single billing plan by slug
SELECT * FROM core_billingplan WHERE slug = $1;

-- Update billing plan
UPDATE core_billingplan 
SET name = COALESCE(NULLIF($1, ''), name),
    price = COALESCE($2, price),
    description = COALESCE(NULLIF($3, ''), description),
    is_active = $4,
    stripe_price_id = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $6;

-- Add feature to billing plan
INSERT INTO core_billingplanfeature (
    plan_id,
    feature_name,
    feature_value,
    is_included
) VALUES (
    $1, -- plan_id
    $2, -- feature_name
    $3, -- feature_value
    $4  -- is_included
);

-- Get billing plan with features
SELECT 
    bp.*,
    json_agg(json_build_object(
        'feature_name', bf.feature_name,
        'feature_value', bf.feature_value,
        'is_included', bf.is_included
    )) AS features
FROM core_billingplan bp
LEFT JOIN core_billingplanfeature bf ON bf.plan_id = bp.id
WHERE bp.id = $1
GROUP BY bp.id;

-- -----------------------------
-- USER BILLING PLAN QUERIES
-- -----------------------------

-- Select billing plan after signup
UPDATE core_userbillingplan 
SET plan_id = $1, -- plan_id
    has_selected_plan = TRUE,
    selected_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $2
RETURNING user_id, plan_id, has_selected_plan;

-- Get user's selected billing plan
SELECT 
    bp.*,
    ubp.has_selected_plan,
    ubp.selected_at
FROM core_userbillingplan ubp
LEFT JOIN core_billingplan bp ON bp.id = ubp.plan_id
WHERE ubp.user_id = $1;

-- Get all users on a specific plan
SELECT 
    u.id,
    u.username,
    u.email,
    ubp.selected_at
FROM core_userbillingplan ubp
JOIN auth_user u ON u.id = ubp.user_id
WHERE ubp.plan_id = $1
ORDER BY ubp.selected_at DESC;

-- -----------------------------
-- SUBSCRIPTION QUERIES
-- -----------------------------

-- Update subscription plan
UPDATE core_subscription 
SET plan = $1, -- plan (free/premium/business)
    status = $2, -- status
    stripe_customer_id = $3,
    stripe_subscription_id = $4,
    current_period_start = $5,
    current_period_end = $6,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $7;

-- Cancel subscription
UPDATE core_subscription 
SET status = 'cancelled',
    stripe_subscription_id = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $1;

-- Get subscription by user
SELECT * FROM core_subscription WHERE user_id = $1;

-- Get active subscriptions
SELECT 
    s.*,
    u.username,
    u.email
FROM core_subscription s
JOIN auth_user u ON u.id = s.user_id
WHERE s.status = 'active';

-- -----------------------------
-- PAYMENT QUERIES
-- -----------------------------

-- Create payment record
INSERT INTO core_payment (
    id,
    user_id,
    subscription_id,
    amount,
    currency,
    payment_method,
    mobile_network,
    phone_number,
    stripe_payment_intent_id,
    stripe_charge_id,
    status,
    description,
    metadata,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(), -- id (UUID)
    $1, -- user_id
    $2, -- subscription_id (can be NULL)
    $3, -- amount
    $4, -- currency (default USD)
    $5, -- payment_method
    $6, -- mobile_network (for mobile money)
    $7, -- phone_number
    $8, -- stripe_payment_intent_id
    $9, -- stripe_charge_id
    $10, -- status
    $11, -- description
    $12, -- metadata (JSON)
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, user_id, amount, status;

-- Update payment status
UPDATE core_payment 
SET status = $1,
    stripe_payment_intent_id = COALESCE($2, stripe_payment_intent_id),
    stripe_charge_id = COALESCE($3, stripe_charge_id),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $4;

-- Get payment by ID
SELECT * FROM core_payment WHERE id = $1;

-- Get user payments
SELECT 
    p.*,
    s.plan AS subscription_plan
FROM core_payment p
LEFT JOIN core_subscription s ON s.id = p.subscription_id
WHERE p.user_id = $1
ORDER BY p.created_at DESC;

-- Get payments by status
SELECT * FROM core_payment WHERE status = $1 ORDER BY created_at DESC;

-- Get payments by date range
SELECT * FROM core_payment 
WHERE created_at BETWEEN $1 AND $2
ORDER BY created_at DESC;

-- -----------------------------
-- INVOICE QUERIES
-- -----------------------------

-- Create invoice
INSERT INTO core_invoice (
    id,
    user_id,
    payment_id,
    invoice_number,
    amount_due,
    amount_paid,
    currency,
    status,
    description,
    due_date,
    stripe_invoice_id,
    billing_name,
    billing_address,
    billing_email,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(), -- id (UUID)
    $1, -- user_id
    $2, -- payment_id (can be NULL)
    $3, -- invoice_number (must be unique)
    $4, -- amount_due
    $5, -- amount_paid (default 0)
    $6, -- currency (default USD)
    $7, -- status (default draft)
    $8, -- description
    $9, -- due_date
    $10, -- stripe_invoice_id
    $11, -- billing_name
    $12, -- billing_address
    $13, -- billing_email
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, invoice_number, amount_due, status;

-- Update invoice status
UPDATE core_invoice 
SET status = $1,
    amount_paid = COALESCE($2, amount_paid),
    paid_at = CASE WHEN $1 = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $3;

-- Add item to invoice
INSERT INTO core_invoiceitem (
    invoice_id,
    description,
    quantity,
    unit_amount,
    amount
) VALUES (
    $1, -- invoice_id
    $2, -- description
    $3, -- quantity
    $4, -- unit_amount
    $5  -- amount (quantity * unit_amount)
);

-- Get invoice by ID
SELECT * FROM core_invoice WHERE id = $1;

-- Get user invoices
SELECT 
    i.*,
    json_agg(json_build_object(
        'description', ii.description,
        'quantity', ii.quantity,
        'unit_amount', ii.unit_amount,
        'amount', ii.amount
    )) AS items
FROM core_invoice i
LEFT JOIN core_invoiceitem ii ON ii.invoice_id = i.id
WHERE i.user_id = $1
GROUP BY i.id
ORDER BY i.created_at DESC;

-- Generate next invoice number
SELECT COALESCE(
    (SELECT MAX(invoice_number)::int FROM core_invoice WHERE invoice_number ~ '^\d+$') + 1,
    1001
) AS next_number;

-- ============================================
-- WEBSITE SQL QUERIES
-- ============================================

-- -----------------------------
-- WEBSITE QUERIES
-- -----------------------------

-- Create new website
INSERT INTO core_website (
    owner_id,
    name,
    slug,
    content,
    status,
    is_published,
    subdomain,
    custom_domain,
    template_used_id,
    settings,
    seo_title,
    seo_description,
    created_at,
    updated_at
) VALUES (
    $1,  -- owner_id
    $2,  -- name
    $3,  -- slug (auto-generated if empty)
    $4,  -- content
    $5,  -- status (draft/published/archived)
    $6,  -- is_published
    $7,  -- subdomain
    $8,  -- custom_domain
    $9,  -- template_used_id
    $10, -- settings (JSON)
    $11, -- seo_title
    $12, -- seo_description
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, name, slug, status, is_published;

-- Update website
UPDATE core_website 
SET name = COALESCE(NULLIF($1, ''), name),
    content = COALESCE($2, content),
    status = COALESCE($3, status),
    is_published = COALESCE($4, is_published),
    subdomain = $5,
    custom_domain = $6,
    settings = COALESCE($7, settings),
    seo_title = COALESCE(NULLIF($8, ''), seo_title),
    seo_description = COALESCE(NULLIF($9, ''), seo_description),
    published_at = CASE WHEN $4 = TRUE AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $10;

-- Get website by ID
SELECT 
    w.*,
    t.name AS template_name,
    t.preview_image AS template_preview
FROM core_website w
LEFT JOIN core_template t ON t.id = w.template_used_id
WHERE w.id = $1;

-- Get website by slug
SELECT * FROM core_website WHERE slug = $1;

-- Get user's websites
SELECT * FROM core_website WHERE owner_id = $1 ORDER BY created_at DESC;

-- Get user's published websites
SELECT * FROM core_website 
WHERE owner_id = $1 AND is_published = TRUE 
ORDER BY published_at DESC;

-- Get websites by status
SELECT * FROM core_website WHERE status = $1 ORDER BY created_at DESC;

-- Delete website
DELETE FROM core_website WHERE id = $1 AND owner_id = $2;

-- Count user's websites
SELECT COUNT(*) FROM core_website WHERE owner_id = $1;

-- -----------------------------
-- TEAM MEMBER QUERIES
-- -----------------------------

-- Add team member to website
INSERT INTO core_teammember (
    website_id,
    user_id,
    role,
    invited_by_id,
    invited_at,
    is_active
) VALUES (
    $1, -- website_id
    $2, -- user_id
    $3, -- role (owner/admin/editor/viewer)
    $4, -- invited_by_id
    CURRENT_TIMESTAMP,
    TRUE
)
RETURNING id, website_id, user_id, role;

-- Update team member role
UPDATE core_teammember 
SET role = $1,
    accepted_at = CASE WHEN accepted_at IS NULL THEN CURRENT_TIMESTAMP ELSE accepted_at END
WHERE id = $2;

-- Remove team member
UPDATE core_teammember 
SET is_active = FALSE
WHERE id = $1;

-- Get website team members
SELECT 
    tm.*,
    u.username,
    u.email,
    u.first_name,
    u.last_name
FROM core_teammember tm
JOIN auth_user u ON u.id = tm.user_id
WHERE tm.website_id = $1 AND tm.is_active = TRUE
ORDER BY 
    CASE tm.role 
        WHEN 'owner' THEN 1 
        WHEN 'admin' THEN 2 
        WHEN 'editor' THEN 3 
        ELSE 4 
    END;

-- Get user's team memberships
SELECT 
    tm.*,
    w.name AS website_name,
    w.slug AS website_slug
FROM core_teammember tm
JOIN core_website w ON w.id = tm.website_id
WHERE tm.user_id = $1 AND tm.is_active = TRUE;

-- Check if user is team member
SELECT EXISTS(
    SELECT 1 FROM core_teammember 
    WHERE website_id = $1 AND user_id = $2 AND is_active = TRUE
) AS is_member;

-- -----------------------------
-- DOMAIN QUERIES
-- -----------------------------

-- Add custom domain to website
INSERT INTO core_domain (
    website_id,
    domain,
    is_primary,
    is_verified,
    verification_code,
    ssl_enabled,
    created_at,
    updated_at
) VALUES (
    $1, -- website_id
    $2, -- domain
    $3, -- is_primary
    FALSE, -- is_verified (default)
    $4, -- verification_code
    FALSE, -- ssl_enabled (default)
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, domain, is_verified;

-- Verify domain
UPDATE core_domain 
SET is_verified = TRUE,
    ssl_enabled = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND verification_code = $2;

-- Set primary domain
UPDATE core_domain 
SET is_primary = FALSE
WHERE website_id = $1;

UPDATE core_domain 
SET is_primary = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $2;

-- Get website domains
SELECT * FROM core_domain WHERE website_id = $1;

-- Get domain by domain name
SELECT * FROM core_domain WHERE domain = $1;

-- Delete domain
DELETE FROM core_domain WHERE id = $1;

-- -----------------------------
-- PAGE ELEMENT QUERIES
-- -----------------------------

-- Add element to page
INSERT INTO core_pageelement (
    website_id,
    page_name,
    element_type,
    element_data,
    position,
    parent_id,
    is_visible,
    created_at,
    updated_at
) VALUES (
    $1, -- website_id
    $2, -- page_name
    $3, -- element_type
    $4, -- element_data (JSON)
    $5, -- position
    $6, -- parent_id (can be NULL for root elements)
    $7, -- is_visible
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, element_type, page_name, position;

-- Update element
UPDATE core_pageelement 
SET element_type = COALESCE($1, element_type),
    element_data = COALESCE($2, element_data),
    position = COALESCE($3, position),
    is_visible = COALESCE($4, is_visible),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $5;

-- Get page elements
SELECT * FROM core_pageelement 
WHERE website_id = $1 AND page_name = $2
ORDER BY position;

-- Get element by ID
SELECT * FROM core_pageelement WHERE id = $1;

-- Delete element
DELETE FROM core_pageelement WHERE id = $1;

-- Reorder elements
UPDATE core_pageelement 
SET position = $1
WHERE id = $2;

-- Get page tree (hierarchical)
WITH RECURSIVE page_tree AS (
    SELECT id, element_type, element_data, position, parent_id, 0 AS depth
    FROM core_pageelement 
    WHERE website_id = $1 AND page_name = $2 AND parent_id IS NULL
    
    UNION ALL
    
    SELECT p.id, p.element_type, p.element_data, p.position, p.parent_id, t.depth + 1
    FROM core_pageelement p
    JOIN page_tree t ON p.parent_id = t.id
)
SELECT * FROM page_tree ORDER BY depth, position;

-- -----------------------------
-- PAGE VIEW / ANALYTICS QUERIES
-- -----------------------------

-- Record page view
INSERT INTO core_pageview (
    website_id,
    page_url,
    visitor_id,
    ip_address,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    browser,
    viewed_at
) VALUES (
    $1, -- website_id
    $2, -- page_url
    $3, -- visitor_id
    $4, -- ip_address
    $5, -- user_agent
    $6, -- referrer
    $7, -- country
    $8, -- city
    $9, -- device_type
    $10, -- browser
    CURRENT_TIMESTAMP
);

-- Get page views for website
SELECT 
    page_url,
    COUNT(*) AS view_count,
    COUNT(DISTINCT visitor_id) AS unique_visitors
FROM core_pageview 
WHERE website_id = $1 AND viewed_at > $2
GROUP BY page_url
ORDER BY view_count DESC;

-- Get daily page views
SELECT 
    DATE(viewed_at) AS date,
    COUNT(*) AS views,
    COUNT(DISTINCT visitor_id) AS unique_visitors
FROM core_pageview 
WHERE website_id = $1 AND viewed_at BETWEEN $2 AND $3
GROUP BY DATE(viewed_at)
ORDER BY date;

-- Get total views
SELECT 
    COUNT(*) AS total_views,
    COUNT(DISTINCT visitor_id) AS unique_visitors
FROM core_pageview 
WHERE website_id = $1;

-- Get top referrers
SELECT 
    referrer,
    COUNT(*) AS count
FROM core_pageview 
WHERE website_id = $1 AND referrer IS NOT NULL
GROUP BY referrer
ORDER BY count DESC
LIMIT 10;

-- Get device breakdown
SELECT 
    device_type,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 2) AS percentage
FROM core_pageview 
WHERE website_id = $1
GROUP BY device_type;

-- ============================================
-- TEMPLATE SQL QUERIES
-- ============================================

-- -----------------------------
-- TEMPLATE QUERIES
-- -----------------------------

-- Create new template
INSERT INTO core_template (
    name,
    slug,
    description,
    category,
    preview_image,
    template_file,
    price,
    is_free,
    is_premium,
    required_plan_id,
    tags,
    is_active,
    download_count,
    rating,
    total_reviews,
    created_at,
    updated_at
) VALUES (
    $1,  -- name
    $2,  -- slug
    $3,  -- description
    $4,  -- category
    $5,  -- preview_image
    $6,  -- template_file
    $7,  -- price
    $8,  -- is_free
    $9,  -- is_premium
    $10, -- required_plan_id
    $11, -- tags (JSON array)
    $12, -- is_active
    0,   -- download_count
    0,   -- rating
    0,   -- total_reviews
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, name, slug, category, price, is_free;

-- Update template
UPDATE core_template 
SET name = COALESCE(NULLIF($1, ''), name),
    description = COALESCE(NULLIF($2, ''), description),
    category = COALESCE($3, category),
    preview_image = COALESCE(NULLIF($4, ''), preview_image),
    template_file = COALESCE($5, template_file),
    price = COALESCE($6, price),
    is_free = COALESCE($7, is_free),
    is_premium = COALESCE($8, is_premium),
    tags = COALESCE($9, tags),
    is_active = COALESCE($10, is_active),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $11;

-- Get template by ID
SELECT * FROM core_template WHERE id = $1;

-- Get template by slug
SELECT * FROM core_template WHERE slug = $1;

-- Get all active templates
SELECT * FROM core_template WHERE is_active = TRUE ORDER BY created_at DESC;

-- Get templates by category
SELECT * FROM core_template 
WHERE is_active = TRUE AND category = $1 
ORDER BY created_at DESC;

-- Get free templates
SELECT * FROM core_template 
WHERE is_active = TRUE AND is_free = TRUE 
ORDER BY created_at DESC;

-- Get premium templates
SELECT * FROM core_template 
WHERE is_active = TRUE AND is_premium = TRUE 
ORDER BY price;

-- Get templates by price range
SELECT * FROM core_template 
WHERE is_active = TRUE AND price BETWEEN $1 AND $2 
ORDER BY price;

-- Search templates by name/description/tags
SELECT * FROM core_template 
WHERE is_active = TRUE 
    AND (name ILIKE '%' || $1 || '%' 
        OR description ILIKE '%' || $1 || '%' 
        OR tags::text ILIKE '%' || $1 || '%')
ORDER BY created_at DESC;

-- Get top rated templates
SELECT * FROM core_template 
WHERE is_active = TRUE AND rating > 0 
ORDER BY rating DESC, total_reviews DESC 
LIMIT $1;

-- Get most downloaded templates
SELECT * FROM core_template 
WHERE is_active = TRUE 
ORDER BY download_count DESC 
LIMIT $1;

-- Get templates requiring specific plan
SELECT * FROM core_template 
WHERE is_active = TRUE AND required_plan_id = $1;

-- Increment download count
UPDATE core_template 
SET download_count = download_count + 1
WHERE id = $1;

-- Update template rating
UPDATE core_template 
SET rating = $1,
    total_reviews = total_reviews + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $2;

-- -----------------------------
-- USER TEMPLATE QUERIES
-- -----------------------------

-- Copy/purchase template (create user template)
INSERT INTO core_usertemplate (
    user_id,
    template_id,
    name,
    content,
    purchased_at,
    website_id
) VALUES (
    $1, -- user_id
    $2, -- template_id
    $3, -- name (custom name for the copy)
    $4, -- content (copied from template)
    CURRENT_TIMESTAMP,
    $5  -- website_id (optional, linked to website)
)
RETURNING id, name, template_id;

-- Update user template
UPDATE core_usertemplate 
SET name = COALESCE(NULLIF($1, ''), name),
    content = COALESCE($2, content)
WHERE id = $3;

-- Get user template by ID
SELECT 
    ut.*,
    t.name AS template_name,
    t.category AS template_category
FROM core_usertemplate ut
JOIN core_template t ON t.id = ut.template_id
WHERE ut.id = $1;

-- Get user's templates
SELECT 
    ut.*,
    t.name AS template_name,
    t.preview_image,
    t.category
FROM core_usertemplate ut
JOIN core_template t ON t.id = ut.template_id
WHERE ut.user_id = $1
ORDER BY ut.purchased_at DESC;

-- Get user's template for specific website
SELECT * FROM core_usertemplate 
WHERE user_id = $1 AND website_id = $2;

-- Delete user template
DELETE FROM core_usertemplate WHERE id = $1 AND user_id = $2;

-- -----------------------------
-- TEMPLATE PURCHASE QUERIES
-- -----------------------------

-- Record template purchase
INSERT INTO core_templatepurchase (
    user_id,
    template_id,
    user_template_id,
    amount,
    payment_status,
    stripe_payment_id,
    created_at
) VALUES (
    $1, -- user_id
    $2, -- template_id
    $3, -- user_template_id (after template is copied)
    $4, -- amount
    $5, -- payment_status
    $6, -- stripe_payment_id
    CURRENT_TIMESTAMP
)
RETURNING id, payment_status;

-- Update purchase payment status
UPDATE core_templatepurchase 
SET payment_status = $1,
    stripe_payment_id = COALESCE($2, stripe_payment_id)
WHERE id = $3;

-- Get purchase by ID
SELECT 
    tp.*,
    t.name AS template_name,
    t.price AS template_price
FROM core_templatepurchase tp
JOIN core_template t ON t.id = tp.template_id
WHERE tp.id = $1;

-- Get user purchases
SELECT 
    tp.*,
    t.name AS template_name,
    t.preview_image,
    ut.name AS user_template_name
FROM core_templatepurchase tp
JOIN core_template t ON t.id = tp.template_id
LEFT JOIN core_usertemplate ut ON ut.id = tp.user_template_id
WHERE tp.user_id = $1
ORDER BY tp.created_at DESC;

-- Get purchases by status
SELECT * FROM core_templatepurchase 
WHERE payment_status = $1 
ORDER BY created_at DESC;

-- Get completed purchases
SELECT 
    tp.*,
    t.name AS template_name
FROM core_templatepurchase tp
JOIN core_template t ON t.id = tp.template_id
WHERE tp.payment_status = 'completed'
ORDER BY tp.created_at DESC;

-- -----------------------------
-- TEMPLATE ORDER QUERIES
-- -----------------------------

-- Create custom template order
INSERT INTO core_templateorder (
    user_id,
    order_type,
    title,
    description,
    requirements,
    status,
    quoted_price,
    invoice_id,
    delivered_template_id,
    notes,
    created_at,
    updated_at
) VALUES (
    $1,  -- user_id
    $2,  -- order_type
    $3,  -- title
    $4,  -- description
    $5,  -- requirements
    'pending', -- status
    $6,  -- quoted_price (can be NULL)
    $7,  -- invoice_id
    $8,  -- delivered_template_id
    $9,  -- notes
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
RETURNING id, status, order_type;

-- Update order status
UPDATE core_templateorder 
SET status = $1,
    quoted_price = COALESCE($2, quoted_price),
    invoice_id = COALESCE($3, invoice_id),
    delivered_template_id = $4,
    notes = COALESCE(NULLIF($5, ''), notes),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $6;

-- Get order by ID
SELECT 
    ord.*,
    t.name AS delivered_template_name,
    i.invoice_number,
    i.status AS invoice_status
FROM core_templateorder ord
LEFT JOIN core_template t ON t.id = ord.delivered_template_id
LEFT JOIN core_invoice i ON i.id = ord.invoice_id
WHERE ord.id = $1;

-- Get user's orders
SELECT * FROM core_templateorder 
WHERE user_id = $1
ORDER BY created_at DESC;

-- Get orders by status
SELECT 
    ord.*,
    u.username,
    u.email
FROM core_templateorder ord
JOIN auth_user u ON u.id = ord.user_id
WHERE ord.status = $1
ORDER BY ord.created_at DESC;

-- Get pending orders
SELECT * FROM core_templateorder 
WHERE status = 'pending'
ORDER BY created_at ASC;

-- Get approved orders (in progress)
SELECT * FROM core_templateorder 
WHERE status = 'approved' OR status = 'in_progress'
ORDER BY updated_at DESC;

-- Complete order (deliver template)
UPDATE core_templateorder 
SET status = 'completed',
    delivered_template_id = $1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $2;

-- Cancel order
UPDATE core_templateorder 
SET status = 'cancelled',
    notes = COALESCE(NULLIF($1, ''), notes) || ' - Cancelled by user',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $2;
