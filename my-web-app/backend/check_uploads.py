import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from core.models import CustomWebsiteUpload

for upload in CustomWebsiteUpload.objects.all():
    index_path = upload.get_index_file_path()
    print(f"ID: {upload.id}, Name: {upload.name}")
    print(f"  Extracted: {upload.extracted_path}")
    print(f"  Index path: {index_path}")
    print(f"  Index exists: {os.path.exists(index_path) if index_path else 'N/A'}")
    print()
