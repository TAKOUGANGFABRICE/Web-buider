# Quick Deployment Reference

## One-Command Deployment (for cPanel with SSH access)

```bash
# 1. Upload all files to server (via FTP/SFTP or git clone)
# 2. SSH into your cPanel account
ssh username@yourdomain.com

# 3. Navigate to project
cd ~/websitebuilder/backend

# 4. Run the deployment script (if you've uploaded deploy.sh)
bash deploy.sh

# OR manually run these commands:
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create and edit .env file (add your actual values)
cp .env.example .env
nano .env  # Edit with your credentials

# Run migrations and collect static
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Create admin user
python manage.py createsuperuser

# Restart Passenger (cPanel)
touch ~/public_html/passenger_wsgi.py
```

## Common cPanel Issues & Fixes

### Issue: "Application Error" or 502
**Solution:**
```bash
# Check passenger_wsgi.py path and permissions
ls -la ~/public_html/passenger_wsgi.py

# Check error logs
tail -f ~/websitebuilder/backend/logs/django.log

# Restart app
touch ~/public_html/passenger_wsgi.py
```

### Issue: Static files return 404
**Solution:**
```bash
# Re-run collectstatic
cd ~/websitebuilder/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Verify symlink
ls -la ~/public_html/static

# If symlink broken, remove and recreate
rm ~/public_html/static
ln -s ~/websitebuilder/backend/staticfiles_build ~/public_html/static
```

### Issue: Database connection fails
**Solution:**
1. In cPanel, go to **Setup Python App**
2. Click "Enter" next to your app
3. Run: `pip install mysqlclient`
   - If that fails, try: `pip install mysqlclient==2.2.4`
4. Verify `.env` has correct DB credentials

### Issue: Permission denied errors
**Solution:**
```bash
# Fix file permissions
find ~/websitebuilder -type f -exec chmod 644 {} \;
find ~/websitebuilder -type d -exec chmod 755 {} \;
chmod 600 ~/websitebuilder/backend/.env
chmod 755 ~/websitebuilder/backend/venv/bin/activate
```

## Environment Variables Quick Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SECRET_KEY` | Yes | Django secret key (generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"`) | `django-insecure-abc123...` |
| `DEBUG` | Yes | Must be `False` in production | `False` |
| `ALLOWED_HOSTS` | Yes | Your domain(s) comma-separated | `example.com,www.example.com` |
| `DB_NAME` | Yes | MySQL database name | `websitebuilder` |
| `DB_USER` | Yes | MySQL username | `root` |
| `DB_PASSWORD` | Yes | MySQL password | `secure_password` |
| `DB_HOST` | Yes | MySQL host (usually localhost) | `localhost` |
| `DB_PORT` | Yes | MySQL port | `3306` |
| `CORS_ALLOWED_ORIGINS` | Yes | Allowed frontend origins | `https://example.com` |
| `EMAIL_HOST` | Optional | SMTP server | `smtp.gmail.com` |
| `EMAIL_HOST_USER` | Optional | SMTP username | `user@gmail.com` |
| `EMAIL_HOST_PASSWORD` | Optional | SMTP password/app password | `xxxx xxxx` |
| `FRONTEND_URL` | Yes | Frontend URL for links | `https://example.com` |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key (for payments) | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Optional | Stripe publishable key | `pk_live_...` |

## Quick Commands Reference

```bash
# Activate virtual environment
cd ~/websitebuilder/backend
source venv/bin/activate

# Run Django shell
python manage.py shell

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Test runserver (for debugging, not production)
python manage.py runserver 0.0.0.0:8000

# Check for issues
python manage.py check
python manage.py check --deploy

# View database
python manage.py dbshell
```

## File Structure on Server

```
/home/username/
├── websitebuilder/              # Your Django project
│   ├── backend/                 # Django project folder
│   │   ├── venv/               # Virtual environment
│   │   ├── staticfiles_build/  # Collected static files
│   │   ├── media/              # User uploaded files
│   │   ├── logs/               # Application logs
│   │   ├── manage.py
│   │   ├── .env               # Environment variables (SECURE!)
│   │   └── ...
│   ├── frontend/               # React frontend
│   │   ├── build/              # Production build (npm run build)
│   │   └── ...
│   └── requirements.txt
│
└── public_html/                # cPanel web root (public)
    ├── static/ -> symlink to ~/websitebuilder/backend/staticfiles_build/
    ├── media/ -> symlink to ~/websitebuilder/backend/media/
    ├── passenger_wsgi.py       # Entry point for Passenger
    └── .htaccess              # Apache configuration
```

## Important Notes

1. **Never commit `.env`** - Keep it out of version control
2. **Regular backups** - Set up cPanel backups or use `mysqldump`
3. **SSL certificate** - Use Let's Encrypt (free) from cPanel
4. **Monitor logs** - Check `~/websitebuilder/backend/logs/django.log` for errors
5. **Keep updated** - Regularly update dependencies: `pip install -r requirements.txt --upgrade`
6. **Use environment variables** - Never hardcode secrets

## Getting Help

- Check logs: `tail -f ~/websitebuilder/backend/logs/django.log`
- Django docs: https://docs.djangoproject.com/
- cPanel documentation: https://docs.cpanel.net/

---

**Last updated:** 2025-04-22
**Version:** 1.0
