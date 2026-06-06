# Website Builder - Production Deployment Guide

## Overview
This guide covers deploying the WaaS (Website Builder as a Service) platform to a cPanel hosting environment.

## Prerequisites
- cPanel hosting account with Python 3.9+ support
- MySQL database (5.7+ or MariaDB 10.3+)
- SSL certificate (for production security)
- Domain name pointed to your hosting

## Pre-Deployment Checklist

### 1. Prepare Your Local Environment
```bash
# Ensure all migrations are up to date
cd backend
python manage.py makemigrations
python manage.py migrate

# Collect static files for production
python manage.py collectstatic --noinput

# Build frontend for production
cd ../frontend
npm run build
```

### 2. Create Production Database
- Log into cPanel → MySQL® Databases
- Create a new database (e.g., `websitebuilder_prod`)
- Create a database user with strong password
- Assign the user to the database with ALL PRIVILEGES
- Note down: DB name, username, password, host (usually localhost)

### 3. Configure Environment Variables
On your cPanel server, create a `.env` file in the `backend/` directory:

```bash
cd backend
nano .env
```

Add the following (replace with your actual values):

```env
# Django Settings
SECRET_KEY=your-generated-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=websitebuilder_prod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Stripe Live Keys
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

**Generate a strong SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 4. Upload Files to cPanel
Using File Manager or FTP:
- Upload the entire project to a directory outside `public_html` (e.g., `~/websitebuilder/`)
- Keep your Django project separate from public web files for security

Recommended structure:
```
/home/username/
├── websitebuilder/          # Django project (not publicly accessible)
│   ├── backend/
│   ├── frontend/
│   ├── venv/
│   └── .env
└── public_html/             # cPanel web root
    └── (static & media files will be linked here)
```

### 5. Set Up Python Virtual Environment
In cPanel:
1. Go to **Setup Python App** (or **Application Manager**)
2. Create a new application:
   - App Name: `websitebuilder`
   - App Directory: `/home/username/websitebuilder/backend`
   - Python Version: 3.9 or higher
   - Set Passenger to enabled
3. Click "Create" - cPanel will create a virtual environment

Alternatively, via SSH:
```bash
cd ~/websitebuilder/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 6. Configure Static Files
cPanel needs to serve static files directly. We'll set up a symlink or copy:

**Option A: Symlink (Recommended)**
```bash
# In cPanel terminal or SSH
cd ~/websitebuilder/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Create symlink from public_html to static files
ln -s ~/websitebuilder/backend/staticfiles_build ~/public_html/static
ln -s ~/websitebuilder/backend/media ~/public_html/media
```

**Option B: Using cPanel File Manager**
- After running `collectstatic`, copy contents of `staticfiles_build/` to `public_html/static/`
- Copy `media/` folder contents to `public_html/media/`

### 7. Configure Passenger (mod_wsgi alternative)
cPanel uses Phusion Passenger for Python apps. Create a passenger_wsgi.py file:

In `~/public_html/` create `passenger_wsgi.py`:

```python
import sys
import os

# Add your project directory to Python path
project_home = '/home/username/websitebuilder/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set Django settings module
os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings_production'

# Activate virtual environment
activate_this = '/home/username/websitebuilder/backend/venv/bin/activate_this.py'
with open(activate_this) as f:
    exec(f.read(), {'__file__': activate_this})

# Import and create WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

**Important:** Replace `username` with your actual cPanel username.

### 8. Configure .htaccess for Static Files
In `public_html/`, create or edit `.htaccess`:

```apache
# Serve static files directly
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/static/
RewriteRule ^static/(.*)$ /static/$1 [L]

RewriteCond %{REQUEST_URI} ^/media/
RewriteRule ^media/(.*)$ /media/$1 [L]

# Forward all other requests to Django
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ passenger_wsgi.py/$1 [L]
```

### 9. Set File Permissions
```bash
# Ensure proper permissions
chmod 755 ~/websitebuilder
chmod 750 ~/websitebuilder/backend
chmod 600 ~/websitebuilder/backend/.env
chmod 755 ~/public_html
```

In cPanel File Manager:
- Set `passenger_wsgi.py` to 644
- Set `.env` to 600 (readable only by owner)

### 10. Create Logs Directory
```bash
mkdir -p ~/websitebuilder/backend/logs
touch ~/websitebuilder/backend/logs/django.log
chmod 755 ~/websitebuilder/backend/logs
```

### 11. Run Database Migrations
Via cPanel Terminal or SSH:
```bash
cd ~/websitebuilder/backend
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

### 12. Create Superuser (Admin)
```bash
python manage.py createsuperuser
# Follow prompts for email, username, password
```

### 13. Seed Initial Data (Optional)
```bash
python manage.py seed_billing_plans
python manage.py create_sample_templates
```

### 14. Restart Passenger
In cPanel:
- Go to **Setup Python App**
- Find your app and click "Restart"

Or via SSH:
```bash
touch ~/public_html/passenger_wsgi.py
```

## Post-Deployment Verification

### 1. Check Application Status
Visit: `https://yourdomain.com` - Should show landing page
Visit: `https://yourdomain.com/admin` - Should show Django admin login
Visit: `https://yourdomain.com/api/` - Should show API root with JSON

### 2. Verify Static Files
- `https://yourdomain.com/static/` should serve CSS/JS files
- Check browser console for 404 errors

### 3. Test Registration Flow
1. Click "Sign Up" on landing page
2. Create a test account
3. Verify you're redirected to dashboard
4. Check that you can create a website

### 4. Test Payment Flow (if using Stripe)
- Use Stripe test mode first
- Complete a test purchase
- Verify webhook endpoint receives events

### 5. Set Up Cron Jobs (Optional)
For periodic tasks, add to cPanel Cron Jobs:

```bash
# Daily cleanup (if needed)
0 2 * * * cd /home/username/websitebuilder/backend && source venv/bin/activate && python manage.py cleanup_old_sessions
```

## Troubleshooting

### Application Returns 500 Error
1. Check error logs: `tail -f ~/websitebuilder/backend/logs/django.log`
2. Verify `.env` file exists and has correct values
3. Ensure virtual environment has all dependencies: `pip install -r requirements.txt`
4. Run migrations: `python manage.py migrate`

### Static Files Not Loading
1. Verify `collectstatic` ran successfully
2. Check symlinks or copied files exist in `public_html/static/`
3. Ensure `.htaccess` is properly configured
4. Check file permissions (644 for files, 755 for directories)

### Database Connection Errors
1. Verify DB credentials in `.env`
2. Ensure MySQL service is running
3. Check that database user has proper privileges
4. Test connection: `python -c "import MySQLdb"` (if mysqlclient installed)

### Email Not Sending
1. Check SMTP settings in `.env`
2. For Gmail, use App Password (not regular password)
3. Verify `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are correct
4. Check spam folder

### 502 Bad Gateway
1. Passenger may not be running - restart it
2. Check `passenger_wsgi.py` for syntax errors
3. Verify Python virtual environment path is correct
4. Check that `DJANGO_SETTINGS_MODULE` points to production settings

## Going Live

### 1. Final Checklist
- [ ] DEBUG = False
- [ ] SECRET_KEY is strong and unique
- [ ] ALLOWED_HOSTS includes your domain
- [ ] SSL/HTTPS is enforced
- [ ] Database backups configured
- [ ] Email sending works
- [ ] Stripe live keys configured (if accepting payments)
- [ ] Static files collected and accessible
- [ ] Admin account created with strong password
- [ ] Firewall/security settings reviewed

### 2. SSL Certificate
cPanel usually provides Let's Encrypt SSL:
- Go to cPanel → SSL/TLS → Manage SSL sites
- Install Let's Encrypt certificate for your domain
- Ensure `SECURE_SSL_REDIRECT = True` in settings

### 3. Backups
Set up regular backups in cPanel:
- Backup Wizard → Full Backup or Partial Backup
- Schedule daily/weekly backups
- Store backups off-site (remote storage)

### 4. Monitoring
Consider setting up:
- Uptime monitoring (UptimeRobot, StatusCake)
- Error tracking (Sentry, Rollbar)
- Log monitoring (cPanel → Metrics → Errors)

## Maintenance

### Updating the Application
1. SSH into server
2. Pull latest code (if using git) or upload new files
3. Activate virtual environment: `source venv/bin/activate`
4. Install new dependencies: `pip install -r requirements.txt`
5. Run migrations: `python manage.py migrate`
6. Collect static: `python manage.py collectstatic --noinput`
7. Restart Passenger: `touch ~/public_html/passenger_wsgi.py`

### Database Backup
```bash
# Manual backup
cd ~/websitebuilder/backend
source venv/bin/activate
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > backup.json

# Or use mysqldump
mysqldump -u username -p database_name > backup.sql
```

## Support
For issues specific to this codebase, refer to:
- README.md for architecture overview
- Code comments for implementation details
- Django documentation: https://docs.djangoproject.com/

---

**Important:** Never commit `.env` file to version control. Always use environment variables in production.
