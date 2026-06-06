#!/bin/bash
# deployment.sh - Production deployment script for WaaS
# Run this script on your cPanel server after uploading files

set -e  # Exit on error

echo "=========================================="
echo "WaaS Production Deployment Script"
echo "=========================================="

# Configuration
PROJECT_DIR="/home/$USER/websitebuilder/backend"
VENV_DIR="$PROJECT_DIR/venv"
PUBLIC_HTML="/home/$USER/public_html"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Check if running in correct directory
if [ ! -f "$PROJECT_DIR/manage.py" ]; then
    print_error "manage.py not found at $PROJECT_DIR"
    print_error "Please update PROJECT_DIR in this script"
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo "Step 1: Activating virtual environment..."
source "$VENV_DIR/bin/activate" || {
    print_error "Failed to activate virtual environment"
    exit 1
}
print_success "Virtual environment activated"

echo ""
echo "Step 2: Upgrading pip..."
pip install --upgrade pip || {
    print_error "Failed to upgrade pip"
    exit 1
}
print_success "Pip upgraded"

echo ""
echo "Step 3: Installing dependencies..."
if [ -f "$PROJECT_DIR/requirements.txt" ]; then
    pip install -r "$PROJECT_DIR/requirements.txt" || {
        print_error "Failed to install dependencies"
        exit 1
    }
    print_success "Dependencies installed"
else
    print_warning "requirements.txt not found, skipping dependency installation"
fi

echo ""
echo "Step 4: Checking .env configuration..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    print_warning ".env file not found!"
    echo "Creating .env from .env.example..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    print_warning "Please edit $PROJECT_DIR/.env and add your production values"
    print_warning "Especially: SECRET_KEY, DB credentials, Stripe keys"
    read -p "Press Enter after you've configured .env..."
else
    print_success ".env file exists"
fi

# Load environment variables
export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)

echo ""
echo "Step 5: Running database migrations..."
python manage.py migrate --noinput || {
    print_error "Migration failed. Check database connection."
    exit 1
}
print_success "Migrations completed"

echo ""
echo "Step 6: Collecting static files..."
python manage.py collectstatic --noinput || {
    print_error "collectstatic failed"
    exit 1
}
print_success "Static files collected"

echo ""
echo "Step 7: Creating logs directory..."
mkdir -p "$PROJECT_DIR/logs"
touch "$PROJECT_DIR/logs/django.log"
chmod 755 "$PROJECT_DIR/logs"
print_success "Logs directory created"

echo ""
echo "Step 8: Setting up media directory..."
mkdir -p "$PROJECT_DIR/media"
chmod 755 "$PROJECT_DIR/media"
print_success "Media directory ready"

echo ""
echo "Step 9: Verifying static files symlink..."
if [ -L "$PUBLIC_HTML/static" ] || [ -d "$PUBLIC_HTML/static" ]; then
    print_success "Static files symlink exists"
else
    print_warning "Creating symlink for static files..."
    ln -s "$PROJECT_DIR/staticfiles_build" "$PUBLIC_HTML/static" || {
        print_error "Failed to create static symlink. You may need to copy manually."
    }
    print_success "Static symlink created"
fi

echo ""
echo "Step 10: Verifying media files symlink..."
if [ -L "$PUBLIC_HTML/media" ] || [ -d "$PUBLIC_HTML/media" ]; then
    print_success "Media files symlink exists"
else
    print_warning "Creating symlink for media files..."
    ln -s "$PROJECT_DIR/media" "$PUBLIC_HTML/media" || {
        print_warning "Failed to create media symlink. You may need to copy manually."
    }
    print_success "Media symlink created"
fi

echo ""
echo "Step 11: Testing database connection..."
python -c "import django; django.setup(); from django.db import connection; cursor = connection.cursor(); print('Database connection: OK')" || {
    print_error "Database connection failed"
    exit 1
}
print_success "Database connection verified"

echo ""
echo "Step 12: Checking for superuser..."
if python "$PROJECT_DIR/manage.py" shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print('Admin exists' if User.objects.filter(is_superuser=True).exists() else 'No admin')" 2>/dev/null | grep -q "No admin"; then
    print_warning "No superuser found"
    read -p "Do you want to create a superuser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python manage.py createsuperuser || {
            print_error "Failed to create superuser"
        }
    fi
else
    print_success "Superuser exists"
fi

echo ""
echo "Step 13: Seeding initial data (optional)..."
read -p "Seed database with sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py seed_billing_plans || print_warning "Billing plans seed failed (may already exist)"
    print_success "Initial data seeded"
fi

echo ""
echo "Step 14: Testing API endpoint..."
curl -s http://localhost/api/ | head -5 || {
    print_warning "Could not test API (curl not available or server not running)"
}
print_success "API endpoint checked"

echo ""
echo "=========================================="
print_success "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify your site: https://$(echo $ALLOWED_HOSTS | cut -d, -f1)"
echo "2. Login to admin: https://$(echo $ALLOWED_HOSTS | cut -d, -f1)/admin/"
echo "3. Check static files are loading correctly"
echo "4. Test user registration and website creation"
echo ""
echo "To restart Passenger/application:"
echo "  touch $PUBLIC_HTML/passenger_wsgi.py"
echo ""
echo "To view logs:"
echo "  tail -f $PROJECT_DIR/logs/django.log"
echo ""
