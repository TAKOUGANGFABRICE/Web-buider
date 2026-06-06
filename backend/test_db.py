import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.db import connection

try:
    cursor = connection.cursor()
    cursor.execute("SELECT 1")
    print("Database connection OK!")
except Exception as e:
    print(f"Database error: {e}")
