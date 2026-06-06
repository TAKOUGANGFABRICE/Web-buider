@echo off
REM prepare_deploy.bat - Prepare project for deployment (Windows)
REM Run this before uploading files to cPanel

echo ===========================================
echo Preparing WaaS for Deployment
echo ===========================================
echo.

REM Check if we're in the right directory
if not exist "backend\manage.py" (
    echo ERROR: Cannot find backend\manage.py
    echo Make sure you run this from the project root directory.
    pause
    exit /b 1
)

echo Step 1: Building frontend for production...
cd frontend
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo  [OK] Frontend built successfully
cd ..

echo.
echo Step 2: Setting up Python virtual environment...
cd backend
if not exist "venv" (
    python -m venv venv
    echo  [OK] Virtual environment created
) else (
    echo  [OK] Virtual environment exists
)

echo.
echo Step 3: Installing Python dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo  [OK] Dependencies installed
cd ..

echo.
echo Step 4: Applying database migrations...
cd backend
call venv\Scripts\activate.bat
python manage.py migrate --noinput
if errorlevel 1 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)
echo  [OK] Migrations applied
cd ..

echo.
echo Step 5: Collecting static files...
cd backend
call venv\Scripts\activate.bat
python manage.py collectstatic --noinput
if errorlevel 1 (
    echo ERROR: collectstatic failed
    pause
    exit /b 1
)
echo  [OK] Static files collected
cd ..

echo.
echo ===========================================
echo Deployment preparation completed!
echo ===========================================
echo.
echo Files are ready to be uploaded to cPanel.
echo.
echo IMPORTANT: Before uploading:
echo 1. Edit backend\.env with your production values
echo 2. Generate a secure SECRET_KEY
echo 3. Ensure database credentials are correct
echo.
echo Next steps:
echo 1. Upload entire project folder to cPanel (outside public_html)
echo 2. SSH into server and run: cd ~/websitebuilder/backend ^&^& bash deploy.sh
echo 3. Or manually follow DEPLOYMENT.md instructions
echo.
pause
