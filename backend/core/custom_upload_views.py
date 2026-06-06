"""
Custom Website Upload API Views
================================
Handles ZIP file uploads, extraction, and HTML to JSON conversion
"""

import os
import zipfile
import json
import uuid
import re
from io import BytesIO

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile

from core.models import CustomWebsiteUpload, WebsiteTemplateJSON
from core.serializers import (
    CustomWebsiteUploadSerializer,
    CustomWebsiteUploadCreateSerializer,
    WebsiteTemplateJSONSerializer,
)


class CustomWebsiteUploadViewSet(viewsets.ModelViewSet):
    """ViewSet for handling custom website ZIP uploads"""

    serializer_class = CustomWebsiteUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return CustomWebsiteUpload.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        """Upload and extract a ZIP file"""
        serializer = CustomWebsiteUploadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data["name"]
        zip_file = serializer.validated_data["zip_file"]

        # Validate file type
        if not zip_file.name.lower().endswith(".zip"):
            return Response(
                {"error": "Only ZIP files are allowed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (max 100MB)
        if zip_file.size > 100 * 1024 * 1024:
            return Response(
                {"error": "File size must be less than 100MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create upload record
        upload = CustomWebsiteUpload.objects.create(
            owner=request.user,
            name=name,
            zip_file=zip_file,
            file_size=zip_file.size,
            status="pending",
        )

        # Extract the ZIP file
        try:
            extract_result = self.extract_zip_file(upload)
            if extract_result["success"]:
                upload.status = "ready"
                upload.extracted_path = extract_result["extracted_path"]
                upload.save()

                serializer = self.get_serializer(upload)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                upload.status = "failed"
                upload.error_message = extract_result["error"]
                upload.save()
                return Response(
                    {"error": extract_result["error"]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            upload.status = "failed"
            upload.error_message = str(e)
            upload.save()
            return Response(
                {"error": f"Failed to process upload: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def extract_zip_file(self, upload):
        """Safely extract ZIP file to media directory"""
        from django.utils.text import slugify

        try:
            # Create unique directory for this upload
            unique_id = str(uuid.uuid4())[:8]
            folder_name = f"{slugify(upload.name)}-{unique_id}"
            extraction_path = os.path.join("uploads", "extracted", folder_name)
            full_extraction_path = os.path.join(settings.MEDIA_ROOT, extraction_path)

            # Create extraction directory
            os.makedirs(full_extraction_path, exist_ok=True)

            # Open and extract ZIP file
            zip_path = upload.zip_file.path
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                # Security: Extract to a safe location
                # Prevent zip slip vulnerabilities
                for member in zip_ref.namelist():
                    member_path = os.path.join(full_extraction_path, member)
                    # Ensure the member is within the extraction directory
                    if not os.path.abspath(member_path).startswith(
                        os.path.abspath(full_extraction_path)
                    ):
                        continue  # Skip files that would be extracted outside

                    # Create directories as needed
                    if member.endswith("/"):
                        os.makedirs(member_path, exist_ok=True)
                    else:
                        os.makedirs(os.path.dirname(member_path), exist_ok=True)
                        with open(member_path, "wb") as f:
                            f.write(zip_ref.read(member))

            # Clean up ZIP file after extraction
            if os.path.exists(zip_path):
                os.remove(zip_path)

            return {
                "success": True,
                "extracted_path": extraction_path,
                "files_count": len(os.listdir(full_extraction_path)),
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    @action(detail=True, methods=["post"])
    def convert_to_template(self, request, pk=None):
        """Convert extracted HTML to JSON template structure"""
        upload = self.get_object()

        if upload.status != "ready":
            return Response(
                {
                    "error": "Website must be ready (extracted successfully) before conversion"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Convert HTML to JSON structure
            json_structure = self.convert_html_to_json(upload)

            # Create template JSON record
            template = WebsiteTemplateJSON.objects.create(
                name=f"{upload.name} (Converted)",
                slug=f"{upload.slug}-converted-{uuid.uuid4().hex[:8]}",
                json_structure=json_structure,
                source_html=self.get_main_html(upload),
                created_from_upload=upload,
            )

            serializer = WebsiteTemplateJSONSerializer(template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Conversion failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def convert_html_to_json(self, upload):
        """Convert HTML content to JSON structure for the builder"""
        main_html_path = upload.get_index_file_path()

        if not main_html_path:
            return {"error": "No HTML file found", "elements": []}

        with open(main_html_path, "r", encoding="utf-8") as f:
            html_content = f.read()

        # Parse HTML and convert to JSON structure
        elements = self.parse_html_elements(html_content, main_html_path)

        return {
            "version": "1.0",
            "type": "converted_template",
            "source_file": os.path.basename(main_html_path),
            "elements": elements,
            "styles": self.extract_styles(html_content),
            "scripts": self.extract_scripts(html_content),
        }

    def parse_html_elements(self, html_content, base_path):
        """Parse HTML content and extract elements"""
        elements = []

        # Simple regex-based parsing (in production, use BeautifulSoup)
        # Extract body content
        body_match = re.search(
            r"<body[^>]*>(.*?)</body>", html_content, re.DOTALL | re.IGNORECASE
        )
        body_content = body_match.group(1) if body_match else html_content

        # Extract headings
        heading_pattern = r"<h([1-6])[^>]*>(.*?)</h\1>"
        for match in re.finditer(
            heading_pattern, body_content, re.DOTALL | re.IGNORECASE
        ):
            elements.append(
                {
                    "type": "heading",
                    "tag": f"h{match.group(1)}",
                    "content": self.strip_tags(match.group(2)),
                    "level": int(match.group(1)),
                }
            )

        # Extract paragraphs
        paragraph_pattern = r"<p[^>]*>(.*?)</p>"
        for match in re.finditer(
            paragraph_pattern, body_content, re.DOTALL | re.IGNORECASE
        ):
            elements.append(
                {"type": "text", "tag": "p", "content": self.strip_tags(match.group(1))}
            )

        # Extract images
        image_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'
        for match in re.finditer(image_pattern, body_content, re.IGNORECASE):
            elements.append(
                {
                    "type": "image",
                    "tag": "img",
                    "src": match.group(1),
                    "alt": self.get_attribute(match.group(0), "alt", ""),
                }
            )

        # Extract links
        link_pattern = r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>'
        for match in re.finditer(link_pattern, body_content, re.DOTALL | re.IGNORECASE):
            elements.append(
                {
                    "type": "button",
                    "tag": "a",
                    "href": match.group(1),
                    "content": self.strip_tags(match.group(2)),
                }
            )

        # Extract div containers
        div_pattern = r'<div[^>]*class=["\']?([^"\']+)["\']?[^>]*>(.*?)</div>'
        for match in re.finditer(div_pattern, body_content, re.DOTALL | re.IGNORECASE):
            elements.append(
                {
                    "type": "container",
                    "tag": "div",
                    "class": match.group(1),
                    "content": self.strip_tags(match.group(2)),
                }
            )

        # Extract sections (header, footer, nav, main, section)
        section_tags = ["header", "footer", "nav", "main", "section", "article"]
        for tag in section_tags:
            pattern = f"<{tag}[^>]*>(.*?)</{tag}>"
            for match in re.finditer(pattern, body_content, re.DOTALL | re.IGNORECASE):
                elements.append(
                    {
                        "type": "section",
                        "tag": tag,
                        "content": self.strip_tags(match.group(1)),
                    }
                )

        return elements

    def strip_tags(self, html):
        """Remove HTML tags from string"""
        return re.sub(r"<[^>]+>", "", html).strip()

    def get_attribute(self, tag_string, attr, default=""):
        """Get attribute value from HTML tag string"""
        pattern = rf'{attr}=["\']([^"\']*)["\']'
        match = re.search(pattern, tag_string, re.IGNORECASE)
        return match.group(1) if match else default

    def extract_styles(self, html_content):
        """Extract CSS styles from HTML"""
        styles = []

        # Extract inline styles
        style_matches = re.findall(
            r"<style[^>]*>(.*?)</style>", html_content, re.DOTALL | re.IGNORECASE
        )
        for style in style_matches:
            styles.append({"type": "inline", "content": style.strip()})

        # Extract external stylesheets
        link_matches = re.findall(
            r'<link[^>]+href=["\']([^"\']+\.css[^"\']*)["\'][^>]*>',
            html_content,
            re.IGNORECASE,
        )
        for href in link_matches:
            styles.append({"type": "external", "href": href})

        return styles

    def extract_scripts(self, html_content):
        """Extract JavaScript from HTML"""
        scripts = []

        # Extract inline scripts
        script_matches = re.findall(
            r"<script[^>]*>(.*?)</script>", html_content, re.DOTALL | re.IGNORECASE
        )
        for script in script_matches:
            scripts.append({"type": "inline", "content": script.strip()})

        # Extract external scripts
        external_matches = re.findall(
            r'<script[^>]+src=["\']([^"\']+\.js[^"\']*)["\'][^>]*>',
            html_content,
            re.IGNORECASE,
        )
        for src in external_matches:
            scripts.append({"type": "external", "src": src})

        return scripts

    def get_main_html(self, upload):
        """Get the main HTML file content"""
        main_html_path = upload.get_index_file_path()

        if not main_html_path:
            return ""

        try:
            with open(main_html_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            return ""

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish the uploaded website"""
        upload = self.get_object()

        if upload.status != "ready":
            return Response(
                {"error": "Website must be ready before publishing"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload.is_published = True
        upload.published_at = timezone.now()
        upload.save()

        serializer = self.get_serializer(upload)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        """Unpublish the website"""
        upload = self.get_object()

        upload.is_published = False
        upload.save()

        serializer = self.get_serializer(upload)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def get_file_list(self, request, pk=None):
        """Get list of extracted files"""
        upload = self.get_object()

        if not upload.get_extracted_directory:
            return Response(
                {"error": "No files extracted"}, status=status.HTTP_404_NOT_FOUND
            )

        files = []
        for root, dirs, filenames in os.walk(upload.get_extracted_directory):
            for filename in filenames:
                filepath = os.path.join(root, filename)
                rel_path = os.path.relpath(filepath, upload.get_extracted_directory)
                files.append(
                    {
                        "name": filename,
                        "path": rel_path,
                        "size": os.path.getsize(filepath),
                    }
                )

        return Response({"files": files})


class WebsiteTemplateJSONViewSet(viewsets.ModelViewSet):
    """ViewSet for converted template JSONs"""

    serializer_class = WebsiteTemplateJSONSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WebsiteTemplateJSON.objects.filter(
            created_from_upload__owner=self.request.user
        )
