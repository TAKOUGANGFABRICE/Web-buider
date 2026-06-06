@echo off
cd /d "c:\Users\admin\Desktop\WEB and App development\Website Builder"

echo Starting Django backend...
start "Backend" cmd /k "cd my-web-app\backend && venv\Scripts\activate.bat && python manage.py runserver 8000"

timeout /t 3 /nobreak > nul

echo Starting React frontend...
start "Frontend" cmd /k "cd my-web-app\frontend && npm start"