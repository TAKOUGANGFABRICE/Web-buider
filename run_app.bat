@echo off
cd /d "c:\Users\admin\Desktop\WEB and App development\Website Builder\my-web-app\backend"
call venv\Scripts\activate.bat
python manage.py runserver 8000
