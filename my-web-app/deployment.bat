@echo off
REM deployment.bat - Windows version of deployment helper
REM Usage: Run from Command Prompt in project root

echo =========================================
echo WaaS Production Deployment Helper (Windows)
echo ==========================================
echo.

echo Note: For cPanel deployment, you typically need to use SSH (PuTTY) or File Manager.
echo This script helps prepare your local project for upload.
echo.

REM Check if required files exist
echo Checking project structure...
if not exist "backend\manage.py" (
    echo ERROR: backend\manage.py not found
    pause
    exit /b 1
) else (
    echo  [OK] Django manage.py found
)

if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found
    pause
    exit /b 1
) else (
    echo  [OK] Frontend package.json found
)

if not exist "backend\requirements.txt" (
    echo ERROR: backend\requirements.txt not found
    pause
    exit /b 1
) else (
    echo  [OK] requirements.txt found
)

echo.
echo Pre-deployment checklist:
echo ------------------------

REM Check for .env file
if exist "backend\.env" (
    echo  [WARNING] .env file found in backend/
    echo  Make sure .env is in .gitignore before committing!
) else (
    echo  [OK] No .env file (good for git)
)

REM Check for build output
if exist "frontend\build\index.html" (
    echo  [OK] Frontend build exists
) else (
    echo  [WARNING] Frontend not built yet
    echo  Run: cd frontend ^&^& npm run build
)

REM Check for virtual environment
if exist "backend\venv" (
    echo  [OK] Python virtual environment exists
) else (
    echo  [INFO] Virtual environment not created yet
    echo  Run: cd backend ^&^& python -m venv venv
)

REM Check for node_modules
if exist "frontend\node_modules" (
    echo  [OK] Node modules installed
) else (
    echo  [INFO] Node modules not installed
    echo  Run: cd frontend ^&^& npm install
)

echo.
echo ==========================================
echo Preparing upload package...
echo ==========================================
echo.

REM Create a temporary folder for clean upload
set UPLOAD_DIR=deploy_upload
if exist "%UPLOAD_DIR%" rmdir /s /q "%UPLOAD_DIR%"
mkdir "%UPLOAD_DIR%"
mkdir "%UPLOAD_DIR%\backend"
mkdir "%UPLOAD_DIR%\frontend"

REM Copy essential files (excluding node_modules, venv, build artifacts, etc.)
echo Copying backend files...
xcopy /E /I /EXCLUDE:deploy_exclude.txt backend %UPLOAD_DIR%\backend >nul

echo Copying frontend files...
xcopy /E /I /EXCLUDE:deploy_exclude.txt frontend %UPLOAD_DIR%\frontend >nul

echo.
echo Deployment package prepared in: %UPLOAD_DIR%
echo.
echo Files to upload to cPanel:
echo  1. Entire '%UPLOAD_DIR%' folder (upload to ~/websitebuilder/)
echo  2. Use File Manager or FTP client (FileZilla, WinSCP)
echo.
echo After upload, SSH into server and run:
echo  cd ~/websitebuilder/backend
echo  bash deploy.sh
echo.
echo Or manually:
echo  python3 -m venv venv
echo  source venv/bin/activate
echo  pip install -r requirements.txt
echo  cp .env.example .env  (and edit with your values)
echo  python manage.py migrate
echo  python manage.py collectstatic --noinput
echo  python manage.py createsuperuser
echo  touch ~/public_html/passenger_wsgi.py
echo.
pause
