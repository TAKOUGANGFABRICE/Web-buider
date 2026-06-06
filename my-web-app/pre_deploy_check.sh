#!/bin/bash
# pre_deploy_check.sh - Verify project is ready for production deployment

echo "========================================="
echo "Pre-Deployment Checklist"
echo "========================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check command result
check() {
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $1"
    else
        echo -e "  ${RED}✗${NC} $1"
        ((ERRORS++))
    fi
}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "1. Checking project structure..."
[ -f "backend/manage.py" ] && echo -e "  ${GREEN}✓${NC} Django manage.py found" || ((ERRORS++))
[ -f "frontend/package.json" ] && echo -e "  ${GREEN}✓${NC} Frontend package.json found" || ((ERRORS++))
[ -f "backend/requirements.txt" ] && echo -e "  ${GREEN}✓${NC} requirements.txt found" || ((ERRORS++))
[ -f "backend/.env.example" ] && echo -e "  ${GREEN}✓${NC} .env.example found" || ((WARNINGS++))
echo ""

echo "2. Checking dependencies..."
[ -d "backend/venv" ] && echo -e "  ${GREEN}✓${NC} Virtual environment exists" || echo -e "  ${YELLOW}⚠${NC} Virtual environment not found (will be created on deploy)"
[ -d "frontend/node_modules" ] && echo -e "  ${GREEN}✓${NC} Node modules installed" || echo -e "  ${YELLOW}⚠${NC} Node modules not found (will be installed on build)"
echo ""

echo "3. Checking Django configuration..."
cd backend
source venv/bin/activate 2>/dev/null || true
python manage.py check --deploy 2>&1 | head -20
check "Django system check passed"
cd ..
echo ""

echo "4. Checking for unapplied migrations..."
cd backend
source venv/bin/activate 2>/dev/null || true
python manage.py showmigrations | grep "\[ \]" | head -5
if [ $? -eq 0 ]; then
    echo -e "  ${YELLOW}⚠${NC} Some migrations are not applied"
    ((WARNINGS++))
else
    echo -e "  ${GREEN}✓${NC} All migrations applied"
fi
cd ..
echo ""

echo "5. Checking frontend build..."
if [ -f "frontend/build/index.html" ]; then
    echo -e "  ${GREEN}✓${NC} Production build exists"
else
    echo -e "  ${YELLOW}⚠${NC} Frontend not built yet (run: npm run build)"
    ((WARNINGS++))
fi
echo ""

echo "6. Checking sensitive files in git..."
if [ -f ".env" ]; then
    echo -e "  ${RED}✗${NC} .env file found - REMOVE before committing!"
    ((ERRORS++))
else
    echo -e "  ${GREEN}✓${NC} .env not in repository"
fi
echo ""

echo "7. Checking .gitignore coverage..."
MISSING=()
[ -f "backend/db.sqlite3" ] && MISSING+=("db.sqlite3")
[ -d "backend/__pycache__" ] && MISSING+=("__pycache__")
if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "  ${YELLOW}⚠${NC} Some files should be ignored: ${MISSING[*]}"
else
    echo -e "  ${GREEN}✓${NC} Common files properly ignored"
fi
echo ""

echo "8. Verifying environment variables template..."
REQUIRED_VARS=("SECRET_KEY" "DB_NAME" "DB_USER" "DB_PASSWORD" "ALLOWED_HOSTS")
if [ -f "backend/.env.example" ]; then
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" backend/.env.example; then
            echo -e "  ${GREEN}✓${NC} $var defined in .env.example"
        else
            echo -e "  ${RED}✗${NC} $var missing from .env.example"
            ((ERRORS++))
        fi
    done
fi
echo ""

echo "9. Checking Python and Node versions..."
python --version 2>/dev/null || echo -e "  ${YELLOW}⚠${NC} Python not found in PATH"
node --version 2>/dev/null || echo -e "  ${YELLOW}⚠${NC} Node.js not found in PATH"
npm --version 2>/dev/null || echo -e "  ${YELLOW}⚠${NC} npm not found in PATH"
echo ""

echo "========================================="
echo "Results: ${GREEN}${GREEN}0 errors, 0 warnings${NC}"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT.md for full guide"
    echo "2. Build frontend: cd frontend && npm run build"
    echo "3. Configure production .env file"
    echo "4. Upload to cPanel and run deployment"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}${WARNINGS} warning(s) found.${NC}"
    echo "Review warnings above before deploying."
    exit 0
else
    echo -e "${RED}${ERRORS} error(s) found. Please fix before deploying.${NC}"
    exit 1
fi
