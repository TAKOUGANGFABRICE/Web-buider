#!/bin/bash
# collect_static.sh - Collect static files for production

set -e

echo "Collecting static files for production..."

# Determine settings module
SETTINGS=${1:-backend.settings_production}

if [ "$SETTINGS" = "backend.settings" ]; then
    echo "WARNING: Using development settings. Static files may be collected to wrong location."
    echo "Use: ./collect_static.sh backend.settings_production"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Activate virtual environment
if [ -f "backend/venv/bin/activate" ]; then
    source backend/venv/bin/activate
elif [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "ERROR: Virtual environment not found"
    exit 1
fi

cd backend

echo "Using DJANGO_SETTINGS_MODULE=$SETTINGS"
export DJANGO_SETTINGS_MODULE=$SETTINGS

# Clear old static files
if [ -d "staticfiles_build" ]; then
    echo "Removing old static files..."
    rm -rf staticfiles_build/*
fi

# Collect static
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Verify
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Static files collected successfully!"
    echo ""
    echo "Static files location: $(pwd)/staticfiles_build/"
    echo ""
    echo "For cPanel deployment, create symlink:"
    echo "  ln -s $(pwd)/staticfiles_build ~/public_html/static"
    echo ""
    echo "Or copy to public_html:"
    echo "  cp -r staticfiles_build/* ~/public_html/static/"
else
    echo ""
    echo "✗ Static file collection failed"
    exit 1
fi
