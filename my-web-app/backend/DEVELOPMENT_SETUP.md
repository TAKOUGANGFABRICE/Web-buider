# Backend & Database Development Setup Guide

This guide covers everything you need to install to work on your Django backend and database effectively.

---

## 1. Python Installation & Environment

### Required Software

| Tool | Purpose | Download |
|------|---------|----------|
| **Python 3.10+** | Python runtime (Django 5.0 requires 3.10+) | [python.org](https://www.python.org/downloads/) |
| **pip** | Package manager (usually comes with Python) | `python -m ensurepip` |
| **venv** | Virtual environment (built into Python 3.3+) | Built-in |

### Setup Commands

```bash
# Navigate to backend folder
cd my-web-app/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip
```

---

## 2. Database Systems

### For Development (Choose One)

#### Option A: SQLite (Simplest - Already Built-in)
```bash
# SQLite comes with Python, no installation needed!
# Just set in settings.py:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

#### Option B: MySQL (Currently in your requirements.txt)
```bash
# Install MySQL Server
# Download: https://dev.mysql.com/downloads/mysql/
# Or use XAMPP/WAMP which includes MySQL

# Install MySQL client library (Windows)
# Download Visual Studio Build Tools from: https://visualstudio.microsoft.com/downloads/
# Then install mysqlclient:
pip install mysqlclient

# Alternative: Use mysql-connector-python (pure Python, no C compiler needed)
pip install mysql-connector-python
```

#### Option C: PostgreSQL (Recommended for Production)
```bash
# Download PostgreSQL: https://www.postgresql.org/download/windows/

# Install psycopg2 (binary version for Windows)
pip install psycopg2-binary

# Or install psycopg2 (requires C compiler)
pip install psycopg2

# For database URL support (recommended)
pip install dj-database-url
```

### Database GUI Tools (Recommended)

| Tool | Description | Cost |
|------|-------------|------|
| **DBeaver** | Universal database tool | Free |
| **DataGrip** | JetBrains database IDE | Paid |
| **pgAdmin** | PostgreSQL specific (comes with PostgreSQL) | Free |
| **MySQL Workbench** | MySQL specific | Free |
| **TablePlus** | Multi-database GUI | Free/$89 |

---

## 3. Python Packages

### Update your requirements.txt with all necessary packages:

```
# Core Django
Django==5.0.4
djangorestframework==3.15.2

# Database
psycopg2-binary==2.9.9          # PostgreSQL support
mysqlclient==2.2.1              # MySQL support (keep if using MySQL)

# Database Utilities
dj-database-url==2.1.0           # Database URL parsing
django-cors-headers==4.3.1      # CORS support
django-filter==23.5             # Advanced filtering
django-cachalot==2.6.1          # Query caching
django-redis==5.4.0             # Redis caching

# Authentication
djangorestframework-simplejwt==5.3.1

# Payments
stripe==8.4.0

# Configuration
python-dotenv==1.0.1
 environs[django]==11.0.0        # Environment variable management

# Image/Storage
Pillow==10.2.0                   # Image processing
boto3==1.34.0                    # AWS S3 for file storage
django-storages==1.14.2          # Django storage backends

# Utilities
requests==2.31.0                 # HTTP requests
celery==5.3.6                    # Task queue
redis==5.0.1                     # Redis client for Celery
django-celery-beat==2.5.0        # Celery scheduler
flower==2.0.1                    # Celery monitoring

# Development
black==23.12.1                   # Code formatting
flake8==7.0.0                    # Linting
isort==5.13.2                    # Import sorting
django-extensions==3.2.3         # Django extensions
ipython==8.20.0                  # Better Python shell

# Testing
pytest==7.4.4                    # Testing framework
pytest-django==4.7.0             # Django testing
pytest-cov==4.1.0                # Coverage reports
factory-boy==3.3.0              # Test fixtures
faker==22.0.0                    # Fake data generation
```

### Quick Install Command

```bash
# Install all core packages at once
pip install Django==5.0.4 \
    djangorestframework==3.15.2 \
    psycopg2-binary==2.9.9 \
    dj-database-url==2.1.0 \
    django-cors-headers==4.3.1 \
    django-filter==23.5 \
    djangorestframework-simplejwt==5.3.1 \
    stripe==8.4.0 \
    python-dotenv==1.0.1 \
    environs==11.0.0 \
    Pillow==10.2.0 \
    requests==2.31.0 \
    celery==5.3.6 \
    redis==5.0.1 \
    django-celery-beat==2.5.0 \
    black==23.12.1 \
    flake8==7.0.0 \
    isort==5.13.2 \
    django-extensions==3.2.3 \
    pytest==7.4.4 \
    pytest-django==4.7.0
```

---

## 4. VS Code Extensions

Install these extensions in VS Code for the best development experience:

### Essential Extensions

| Extension | Purpose | Install Command |
|-----------|---------|-----------------|
| **Python** | Python language support | Built-in |
| **Pylance** | Fast Python language server | Built-in |
| **Django** | Django template support | Search "batisteo.vscode-django" |
| **Django Template** | Syntax highlighting for Django | Search "bibhasdn.django-html" |
| **SQLite** | SQLite viewer | Search "alexcvzz.vscode-sqlite" |
| **PostgreSQL** | PostgreSQL client | Search "ms-ossdata.vscode-postgresql" |
| **MySQL** | MySQL client | Search "formulahendry.mysql" |
| **REST Client** | Test APIs without Postman | Search "humao.rest-client" |

### Recommended Extensions

| Extension | Purpose |
|-----------|---------|
| **GitLens** | Enhanced Git integration |
| **Bracket Pair Colorizer** | Color-coded brackets |
| **Auto Rename Tag** | Auto-rename HTML/JSX tags |
| **ESLint** | JavaScript linting |
| **Prettier** | Code formatting |
| **Thunder Client** | Lightweight API client |
| **Error Lens** | Inline error highlighting |
| **Path Intellisense** | Path autocompletion |

### Install All Recommended Extensions

Create a `.vscode/extensions.json` file:

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "batisteo.vscode-django",
    "alexcvzz.vscode-sqlite",
    "ms-ossdata.vscode-postgresql",
    "formulahendry.mysql",
    "humao.rest-client",
    "eamodio.gitlens",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "christian-kohler.path-intellisense",
    "usernamehw.errorlens"
  ]
}
```

---

## 5. VS Code Settings

Create/update `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "backend/venv/Scripts/python.exe",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "python.sortImports.args": ["--profile", "black"],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "explicit"
    }
  },
  "[django-html]": {
    "editor.formatOnSave": true
  },
  "files.associations": {
    "**/*.html": "django-html",
    "**/templates/**": "django-txt",
    "**/migrations/**": "sql"
  },
  "rest-client.environmentVariables": {
    "$shared": {
      "baseUrl": "http://localhost:8000/api"
    },
    "$development": {
      "baseUrl": "http://localhost:8000/api"
    },
    "$production": {
      "baseUrl": "https://your-domain.com/api"
    }
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/.pytest_cache": true
  }
}
```

---

## 6. Optional: Docker Setup

For containerized development:

### docker-compose.yml (already exists, update with PostgreSQL):

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: website_builder
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  web:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/website_builder
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy

  celery:
    build: ./backend
    command: celery -A backend worker -l info
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/website_builder
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - db

volumes:
  postgres_data:
  redis_data:
```

---

## 7. Quick Start Checklist

### Windows Installation

```powershell
# 1. Install Python from https://www.python.org/downloads/
#    Make sure to check "Add Python to PATH"

# 2. Open Command Prompt/PowerShell in backend folder
cd my-web-app/backend

# 3. Create virtual environment
python -m venv venv

# 4. Activate it
.\venv\Scripts\Activate

# 5. Install packages
pip install -r requirements-full.txt

# 6. Install PostgreSQL from https://www.postgresql.org/download/windows/

# 7. Create database
psql -U postgres
CREATE DATABASE website_builder;
\q

# 8. Copy .env.example to .env and configure
copy .env.example .env

# 9. Edit .env with your database credentials

# 10. Run migrations
python manage.py migrate

# 11. Create superuser
python manage.py createsuperuser

# 12. Run server
python manage.py runserver
```

### Verify Installation

```bash
# Check Python version
python --version

# Check pip
pip --version

# Check Django installation
python -c "import django; print(django.__version__)"

# Check database connection
python manage.py dbshell

# Run all tests
python manage.py test

# Check for issues
python manage.py check --deploy
```

---

## 8. Environment Variables (.env)

Create a `.env` file in `my-web-app/backend/`:

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/website_builder

# Redis (for caching and Celery)
REDIS_URL=redis://localhost:6379/0

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (for file storage - optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1
```

---

## 9. Common Issues & Solutions

### Issue: mysqlclient installation fails on Windows
```bash
# Solution: Install Visual Studio Build Tools first
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"

# Or use PyMySQL instead
pip install pymysql
# Then add to settings.py:
# import pymysql
# pymysql.install_as_MySQLdb()
```

### Issue: PostgreSQL connection refused
```bash
# Make sure PostgreSQL service is running
# Windows: Start > Services > postgresql-x64-xx
# Or: pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

### Issue: 'python' not recognized
```bash
# Add Python to PATH:
# Windows: System Properties > Environment Variables > PATH
# Add: C:\Python311 (or your Python installation path)
```

### Issue: Port 8000 already in use
```bash
# Find and kill the process
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

---

## 10. Useful Commands Reference

```bash
# Virtual Environment
python -m venv venv                    # Create
.\venv\Scripts\activate               # Activate (Windows)
source venv/bin/activate              # Activate (Mac/Linux)
deactivate                             # Deactivate

# Django
python manage.py runserver             # Start server
python manage.py migrate               # Apply migrations
python manage.py makemigrations        # Create migrations
python manage.py createsuperuser       # Create admin user
python manage.py shell                  # Django shell
python manage.py dbshell               # Database shell
python manage.py check                  # Check for issues
python manage.py test                  # Run tests

# Code Quality
black .                                 # Format code
flake8 .                                # Lint code
isort .                                 # Sort imports
pytest                                   # Run tests with coverage

# Celery
celery -A backend worker -l info        # Start worker
celery -A backend beat -l info          # Start scheduler
flower -A backend                       # Start monitoring

# Docker
docker-compose up -d                    # Start containers
docker-compose down                    # Stop containers
docker-compose logs -f                 # View logs
docker-compose exec web python manage.py migrate  # Run migrations in container
```

---

## Summary: Minimum Requirements

| Category | Minimum | Recommended |
|----------|---------|-------------|
| **Python** | 3.10+ | 3.12+ |
| **Database** | SQLite (built-in) | PostgreSQL 16 |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 5 GB | 20 GB |

### Essential Tools to Install:
1. ✅ Python 3.10+ (with pip)
2. ✅ VS Code with Python extension
3. ✅ PostgreSQL (recommended) OR MySQL OR SQLite
4. ✅ PostgreSQL/MySQL GUI tool (DBeaver recommended)
5. ✅ Packages from requirements.txt
6. ✅ Redis (for Celery caching - optional for dev)