"""
Test suite for CustomWebsiteUpload preview functionality
Tests URL rewriting, base tag insertion, and asset serving.
"""
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from core.models import CustomWebsiteUpload, User
from django.core.files.uploadedfile import SimpleUploadedFile
import zipfile
import os
from io import BytesIO


class CustomWebsiteUploadPreviewTests(TestCase):
    """Test ZIP upload extraction and preview"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def create_test_zip(self, html_content, files=None):
        """Create a simple ZIP file with given HTML and optional extra files"""
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr('index.html', html_content)
            if files:
                for filename, content in files.items():
                    zipf.writestr(filename, content)
        zip_buffer.seek(0)
        return SimpleUploadedFile(
            "test.zip",
            zip_buffer.read(),
            content_type="application/zip"
        )

    def test_upload_and_preview_basic_html(self):
        """Test uploading a basic HTML file and getting preview"""
        html = """<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<h1>Hello World</h1>
<img src="/images/logo.png">
<link rel="stylesheet" href="/css/style.css">
</body>
</html>"""
        zip_file = self.create_test_zip(html)

        response = self.client.post(
            reverse('custom-upload-list'),
            {'name': 'Test Site', 'zip_file': zip_file},
            format='multipart'
        )
        self.assertEqual(response.status_code, 201)
        upload_id = response.data['id']

        # Poll until ready
        import time
        for _ in range(10):
            response = self.client.get(reverse('custom-upload-detail', args=[upload_id]))
            if response.data['status'] == 'ready':
                break
            time.sleep(1)

        self.assertEqual(response.data['status'], 'ready')

        # Get preview
        preview_response = self.client.get(
            reverse('custom-upload-preview', args=[upload_id])
        )
        self.assertEqual(preview_response.status_code, 200)
        data = preview_response.json()
        self.assertIn('html_content', data)

        # Check that base tag was added
        self.assertIn('<base href="/api/custom-uploads/', data['html_content'])
        # Check that absolute paths were rewritten
        self.assertIn('src="/api/custom-uploads/', data['html_content'])  # /images/...
        self.assertIn('href="/api/custom-uploads/', data['html_content'])  # /css/...

    def test_preview_with_existing_base_tag(self):
        """Test that existing base tag is preserved"""
        html = """<!DOCTYPE html>
<html>
<head><base href="http://original.com/"></head>
<body>Test</body>
</html>"""
        zip_file = self.create_test_zip(html)

        response = self.client.post(
            reverse('custom-upload-list'),
            {'name': 'Test With Base',
             'zip_file': zip_file},
            format='multipart'
        )
        self.assertEqual(response.status_code, 201)
        upload_id = response.data['id']

        # Wait for ready
        import time
        for _ in range(10):
            r = self.client.get(reverse('custom-upload-detail', args=[upload_id]))
            if r.data['status'] == 'ready':
                break
            time.sleep(1)

        preview = self.client.get(reverse('custom-upload-preview', args=[upload_id]))
        self.assertEqual(preview.status_code, 200)
        html_out = preview.json()['html_content']
        # Should NOT add another base tag if one exists
        self.assertEqual(html_out.count('<base'), 1)
        self.assertIn('original.com', html_out)

    def test_preview_without_head_tag(self):
        """Test HTML without <head> tag gets base tag at start"""
        html = """<!DOCTYPE html>
<html>
<body>No head tag</body>
</html>"""
        zip_file = self.create_test_zip(html)

        response = self.client.post(
            reverse('custom-upload-list'),
            {'name': 'No Head',
             'zip_file': zip_file},
            format='multipart'
        )
        upload_id = response.data['id']
        # Wait...
        import time
        for _ in range(10):
            r = self.client.get(reverse('custom-upload-detail', args=[upload_id]))
            if r.data['status'] == 'ready':
                break
            time.sleep(1)

        preview = self.client.get(reverse('custom-upload-preview', args=[upload_id]))
        html_out = preview.json()['html_content']
        # Base tag should be at beginning
        self.assertTrue(html_out.startswith('<base href=') or html_out.startswith('\n<base href='))

    def test_asset_serving_via_api(self):
        """Test that extracted assets are served via /api/custom-uploads/<id>/file/"""
        css_content = "body { color: red; }"
        js_content = "console.log('test');"
        html = f"""<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
</head>
<body>Test</body>
</html>"""
        zip_file = self.create_test_zip(html, {
            'style.css': css_content,
            'script.js': js_content,
        })

        response = self.client.post(
            reverse('custom-upload-list'),
            {'name': 'Asset Test',
             'zip_file': zip_file},
            format='multipart'
        )
        upload_id = response.data['id']

        # Wait for ready
        import time
        for _ in range(10):
            r = self.client.get(reverse('custom-upload-detail', args=[upload_id]))
            if r.data['status'] == 'ready':
                break
            time.sleep(1)

        # Fetch CSS via asset endpoint
        css_response = self.client.get(
            f'/api/custom-uploads/{upload_id}/file/style.css'
        )
        self.assertEqual(css_response.status_code, 200)
        # FileResponse uses streaming content
        css_data = b''.join(css_response.streaming_content).decode()
        self.assertEqual(css_data, css_content)

        # Fetch JS
        js_response = self.client.get(
            f'/api/custom-uploads/{upload_id}/file/script.js'
        )
        self.assertEqual(js_response.status_code, 200)
        js_data = b''.join(js_response.streaming_content).decode()
        self.assertEqual(js_data, js_content)
