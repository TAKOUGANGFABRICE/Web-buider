"""
Custom Website Upload API Views
===============================
Handles ZIP file uploads, extraction, and HTML to JSON conversion
"""

import os
import zipfile
import json
import uuid
import re
import logging
from io import BytesIO
from datetime import datetime

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

# Configure logger for upload processing
upload_logger = logging.getLogger('upload_processing')
if not upload_logger.handlers:
    # Avoid duplicate handlers in Django reloads
    upload_handler = logging.FileHandler(os.path.join(settings.BASE_DIR, '..', 'upload_processing.log'))
    upload_handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    upload_handler.setFormatter(formatter)
    upload_logger.addHandler(upload_handler)
upload_logger.setLevel(logging.INFO)

# Alias for convenience
logger = upload_logger

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

    def get_permissions(self):
        if self.action == "serve_file" or self.action == "serve_file_asset":
            return []
        return super().get_permissions()

    def get_queryset(self):
        return CustomWebsiteUpload.objects.filter(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        from core.plan_checker import check_storage_usage
        
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

        # Validate file size (max 500MB)
        if zip_file.size > 500 * 1024 * 1024:
            return Response(
                {"error": "File size must be less than 500MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check disk space quota
        allowed, used, limit, message = check_storage_usage(request.user, zip_file.size)
        if not allowed:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

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
        """Extract ZIP file to media directory - with detailed logging"""
        from django.utils.text import slugify

        try:
            start_time = datetime.now()
            logger.info(f"[ZIP Extract] Starting extraction for upload ID {upload.id}, name: {upload.name}")

            # Create unique directory for this upload
            unique_id = str(uuid.uuid4())[:8]
            folder_name = f"{slugify(upload.name)}-{unique_id}"
            extraction_path = os.path.join("uploads", "extracted", folder_name)
            full_extraction_path = os.path.join(settings.MEDIA_ROOT, extraction_path)

            logger.info(f"[ZIP Extract] Extraction path: {full_extraction_path}")

            # Create extraction directory
            os.makedirs(full_extraction_path, exist_ok=True)

            # Detect SQL files and main HTML file
            sql_files = []
            index_html_path = None

            index_names = [
                "index.html", "index.htm", "index.php",
                "home.html", "home.htm", "home.php",
                "default.html", "default.htm", "default.php",
            ]

            # Open and validate ZIP
            zip_path = upload.zip_file.path
            logger.info(f"[ZIP Extract] Reading ZIP from: {zip_path}")

            try:
                zip_ref = zipfile.ZipFile(zip_path, "r")
            except zipfile.BadZipFile:
                logger.error(f"[ZIP Extract] Invalid ZIP file for upload {upload.id}")
                return {
                    "success": False,
                    "error": "Invalid or corrupted ZIP file. Please ensure it's a valid ZIP archive.",
                }
            except Exception as e:
                logger.error(f"[ZIP Extract] Cannot read ZIP file {upload.id}: {str(e)}")
                return {"success": False, "error": f"Cannot read ZIP file: {str(e)}"}

            with zip_ref:
                # Check for encrypted ZIPs
                for member in zip_ref.infolist():
                    if member.flag_bits & 0x1:
                        logger.warning(f"[ZIP Extract] Encrypted ZIP detected for upload {upload.id}")
                        return {
                            "success": False,
                            "error": "Password-protected ZIPs are not supported. Please remove the password and try again.",
                        }

                all_members = zip_ref.namelist()
                logger.info(f"[ZIP Extract] ZIP contains {len(all_members)} files")

                # First pass: find SQL files and index HTML
                for member in all_members:
                    try:
                        member_lower = member.lower()
                    except Exception:
                        continue

                    member_normalized = member.replace("\\", "/")

                    if member_normalized.lower().endswith(".sql"):
                        sql_files.append(member)
                        logger.info(f"[ZIP Extract] Found SQL file: {member}")

                    # Find index.html in root or public_html/
                    if not index_html_path:
                        filename = os.path.basename(member_normalized)
                        if filename in index_names:
                            index_html_path = member
                            logger.info(f"[ZIP Extract] Found index at root: {member}")
                        elif "public_html" in member_normalized and index_html_path is None:
                            basename = os.path.basename(member_normalized)
                            if basename in index_names:
                                index_html_path = member
                                logger.info(f"[ZIP Extract] Found index in public_html: {member}")

                # Second pass: extract files
                extracted_count = 0
                for member in all_members:
                    try:
                        member_normalized = member.replace("\\", "/")
                        member_path = os.path.join(full_extraction_path, member_normalized)

                        abs_member_path = os.path.abspath(member_path)
                        abs_extract_path = os.path.abspath(full_extraction_path)
                        if not abs_member_path.startswith(abs_extract_path):
                            logger.warning(f"[ZIP Extract] Skipping suspicious path: {member}")
                            continue

                        # Create parent directories
                        parent_dir = os.path.dirname(member_path)
                        if parent_dir:
                            os.makedirs(parent_dir, exist_ok=True)

                        # Skip directories
                        if member_normalized.endswith("/"):
                            continue

                        content = zip_ref.read(member)
                        if content:
                            with open(member_path, "wb") as f:
                                f.write(content)
                            extracted_count += 1

                    except Exception as e:
                        logger.error(f"[ZIP Extract] Error extracting {member}: {str(e)}")
                        continue

                logger.info(f"[ZIP Extract] Extracted {extracted_count} files")

            # If no index.html found, search in extracted files
            if not index_html_path:
                index_html_path = upload.get_index_file_path()
                if index_html_path:
                    logger.info(f"[ZIP Extract] Index found by scanning: {index_html_path}")
                else:
                    logger.error(f"[ZIP Extract] No index.html found for upload {upload.id}")

            # SQL import attempt
            db_imported = False
            db_error = None
            if sql_files:
                sql_path = os.path.join(full_extraction_path, sql_files[0])
                db_imported, db_error = self.import_sql_database(sql_path)
                if db_imported:
                    logger.info(f"[ZIP Extract] Database import successful")
                elif db_error:
                    logger.warning(f"[ZIP Extract] DB import note: {db_error}")

            # Clean up ZIP
            if os.path.exists(zip_path):
                os.remove(zip_path)
                logger.info(f"[ZIP Extract] Removed ZIP file after extraction")

            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(f"[ZIP Extract] Completed in {elapsed:.2f}s - upload {upload.id}")

            return {
                "success": True,
                "extracted_path": extraction_path,
                "index_html_path": index_html_path,
                "sql_files": sql_files,
                "database_imported": db_imported,
                "database_error": db_error,
                "files_count": extracted_count,
            }

        except Exception as e:
            logger.error(f"[ZIP Extract] Unexpected error for upload {upload.id}: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def import_sql_database(self, sql_file_path):
        """Import SQL database file if present"""
        import subprocess
        from django.conf import settings

        try:
            if not os.path.exists(sql_file_path):
                return False, "SQL file not found"

            # Get database credentials from settings
            db_settings = settings.DATABASES["default"]
            db_name = db_settings["NAME"]
            db_user = db_settings["USER"]
            db_password = db_settings["PASSWORD"]
            db_host = db_settings["HOST"]
            db_port = db_settings["PORT"]

            # Read and execute SQL file
            with open(sql_file_path, "r", encoding="utf-8", errors="ignore") as f:
                sql_content = f.read()

            # For MySQL, use mysql command
            if "mysql" in db_settings["ENGINE"]:
                try:
                    result = subprocess.run(
                        [
                            "mysql",
                            "-h",
                            db_host or "localhost",
                            "-P",
                            str(db_port) or "3306",
                            "-u",
                            db_user,
                            f"-p{db_password}",
                            db_name,
                        ],
                        input=sql_content,
                        capture_output=True,
                        text=True,
                        timeout=60,
                    )

                    if result.returncode == 0:
                        return True, None
                    else:
                        return False, result.stderr
                except FileNotFoundError:
                    return False, "MySQL client not found"
            else:
                # For SQLite, just check the file exists (can't import directly)
                return None, "Database import not supported for SQLite"

        except Exception as e:
            return False, str(e)

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

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        """Preview the extracted website - returns HTML with corrected asset URLs"""
        upload = self.get_object()

        if upload.status != "ready":
            return Response(
                {"error": "Website must be ready before preview"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        index_path = upload.get_index_file_path()
        if not index_path:
            return Response(
                {"error": "No index.html file found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            with open(index_path, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()

            # Base URL for serving extracted files via API
            base_url = f"/api/custom-uploads/{upload.id}/file/"

            # 1. Ensure <base> tag exists for relative URL resolution
            if "<base href=" not in html_content:
                head_match = re.search(r"<head[^>]*>", html_content, re.IGNORECASE)
                if head_match:
                    html_content = html_content.replace(
                        head_match.group(0),
                        head_match.group(0) + f'<base href="{base_url}" target="_blank">',
                        1
                    )
                else:
                    # No <head> tag - prepend base at start
                    html_content = f'<base href="{base_url}" target="_blank">\n{html_content}'

            # 2. Rewrite absolute paths (starting with / but not API/static/media/external)
            def rewrite_absolute_urls(content):
                """Rewrite URLs that start with / to use our asset server"""
                # Patterns to skip (already absolute or external)
                skip_prefixes = (
                    '/api/', '/static/', '/media/',
                    'http://', 'https://', '//', 'data:', 'mailto:', 'tel:', 'javascript:'
                )

                def replace_src_href(match):
                    attr = match.group(1)
                    url = match.group(2)
                    # Check skip patterns
                    for prefix in skip_prefixes:
                        if url.startswith(prefix):
                            return match.group(0)
                    # Rewrite: remove leading slash and prepend base_url
                    return f'{attr}="{base_url}{url[1:]}"'

                # Match src="/..." or href="/..."
                content = re.sub(
                    r'(src|href)\s*=\s*["\'](/[^"\'<>]*?)["\']',
                    replace_src_href,
                    content,
                    flags=re.IGNORECASE
                )

                # Fix CSS url('/...') patterns
                def replace_css_url(match):
                    url = match.group(1)
                    for prefix in skip_prefixes:
                        if url.startswith(prefix.replace('"','').replace("'",'')) or prefix.startswith('http'):
                            # For CSS url(), skip absolute URLs
                            if any(url.startswith(p.rstrip('/')) for p in ['http://','https://','//','data:','/']):
                                return match.group(0)
                    # Remove leading slash and prepend base_url
                    if url.startswith('/'):
                        return f'url("{base_url}{url[1:]}"'
                    elif url.startswith('./'):
                        return f'url("{base_url}{url[2:]}"'
                    else:
                        return f'url("{base_url}{url}"'

                # Match url('/...') or url("/...") or url(...)
                content = re.sub(
                    r'url\(\s*["\']?(/?[^"\'\)]*?)["\']?\)',
                    replace_css_url,
                    content,
                    flags=re.IGNORECASE
                )

                return content

            html_content = rewrite_absolute_urls(html_content)

            # 3. Fix paths starting with ./
            def fix_relative_paths(content):
                # src="./file" -> src="{base_url}file"
                content = re.sub(
                    r'(src|href)\s*=\s*["\']\./([^"\'<>]*?)["\']',
                    rf'\1="{base_url}\2"',
                    content,
                    flags=re.IGNORECASE
                )
                # CSS: url('./...')
                content = re.sub(
                    r'url\(\s*["\']?\./([^"\'\)]*?)["\']?\)',
                    f'url("{base_url}"' + r'\1)',
                    content,
                    flags=re.IGNORECASE
                )
                return content

            html_content = fix_relative_paths(html_content)

            return Response(
                {
                    "html_content": html_content,
                    "preview_url": f"/api/custom-uploads/{upload.id}/index/",
                    "extracted_path": upload.extracted_path,
                    "index_filename": os.path.basename(index_path),
                    "base_path": os.path.dirname(index_path),
                }
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to read file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"], url_path="index")
    def serve_file(self, request, pk=None):
        """Serve the index.html from extracted files (used by legacy preview)"""
        from django.http import Http404, HttpResponse
        import re

        upload = self.get_object()

        if upload.status != "ready":
            raise Http404("Website not ready")

        index_path = upload.get_index_file_path()
        if not index_path or not os.path.exists(index_path):
            raise Http404("No index.html found")

        with open(index_path, "r", encoding="utf-8", errors="ignore") as f:
            html_content = f.read()

        extracted_dir = upload.get_extracted_directory
        if not extracted_dir:
            raise Http404("Extracted directory not found")

        folder_path = upload.extracted_path.replace("\\", "/")
        index_dir = os.path.dirname(index_path)
        rel_path_to_root = os.path.relpath(index_dir, extracted_dir).replace("\\", "/")

        # Build base URL to serve static assets
        if rel_path_to_root == ".":
            base_url = f"/media/{folder_path}/"
        else:
            base_url = f"/media/{folder_path}/{rel_path_to_root}/"
        base_url = base_url.replace("//", "/")

        # Add <base> tag
        base_tag = f'<base href="{base_url}" target="_blank">'
        head_match = re.search(r"<head[^>]*>", html_content, re.IGNORECASE)
        if head_match:
            html_content = html_content.replace(head_match.group(0), head_match.group(0) + base_tag, 1)
        else:
            html_content = base_tag + html_content

        # Rewrite absolute and relative asset URLs
        def rewrite_urls(content):
            skip_prefixes = (
                '/api/', '/static/', '/media/',
                'http://', 'https://', '//', 'data:', 'mailto:', 'tel:', 'javascript:'
            )

            def replace_src_href(match):
                attr, url = match.group(1), match.group(2)
                if any(url.startswith(p) for p in skip_prefixes):
                    return match.group(0)
                return f'{attr}="{base_url}{url[1:]}"'  # remove leading slash

            content = re.sub(
                r'(src|href)\s*=\s*["\'](/[^"\'<>]*?)["\']',
                replace_src_href,
                content,
                flags=re.IGNORECASE
            )

            # CSS url()
            def replace_css(match):
                url = match.group(1)
                if any(url.startswith(p.rstrip('/')) for p in ['http://','https://','//','data:','/api/','/static/','/media/']):
                    return match.group(0)
                if url.startswith('/'):
                    return f'url("{base_url}{url[1:]}"'
                elif url.startswith('./'):
                    return f'url("{base_url}{url[2:]}"'
                return f'url("{base_url}{url}"'

            content = re.sub(r'url\(\s*["\']?([^"\'\)]+?)["\']?\)', replace_css, content, flags=re.IGNORECASE)

            return content

        html_content = rewrite_urls(html_content)

        response = HttpResponse(html_content, content_type="text/html; charset=utf-8")
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response["X-Frame-Options"] = "SAMEORIGIN"
        response["X-Content-Type-Options"] = "nosniff"
        return response

    @action(detail=True, methods=["get"], url_path="file/(?P<file_path>.+)")
    def serve_file_asset(self, request, pk=None, file_path=None):
        """Serve extracted files for preview with proper CORS headers"""
        from django.http import FileResponse, Http404
        import os

        upload = self.get_object()

        if upload.status != "ready":
            raise Http404("Website not ready")

        # Normalize and validate path
        file_path = file_path.replace("\\", "/").replace("//", "/").strip("/")

        if ".." in file_path:
            raise Http404("Invalid path")

        # Ensure path stays within extracted directory
        extracted_dir = upload.get_extracted_directory
        if not extracted_dir or not os.path.exists(extracted_dir):
            raise Http404("Extracted files not found")

        # Build candidate paths
        full_path = os.path.join(extracted_dir, file_path)
        full_path = os.path.normpath(full_path)

        # Security: ensure resolved path is within extracted_dir
        if not full_path.startswith(os.path.abspath(extracted_dir)):
            raise Http404("Access denied")

        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            # Try alternative with stripped leading slash
            alt_path = os.path.join(extracted_dir, file_path.lstrip("/"))
            alt_path = os.path.normpath(alt_path)
            if os.path.exists(alt_path) and os.path.isfile(alt_path):
                full_path = alt_path
            else:
                raise Http404(f"File not found: {file_path}")

        # Determine content type
        ext = os.path.splitext(full_path)[1].lower()
        content_types = {
            ".html": "text/html",
            ".htm": "text/html",
            ".css": "text/css",
            ".js": "application/javascript",
            ".mjs": "application/javascript",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
            ".webp": "image/webp",
            ".woff": "font/woff",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
            ".otf": "font/otf",
            ".eot": "application/vnd.ms-fontobject",
            ".mp4": "video/mp4",
            ".webm": "video/webm",
            ".pdf": "application/pdf",
            ".txt": "text/plain",
            ".xml": "application/xml",
        }
        content_type = content_types.get(ext, "application/octet-stream")

        # Serve file
        response = FileResponse(open(full_path, "rb"), content_type=content_type)

        # CORS headers for cross-origin iframe embedding
        response["Access-Control-Allow-Origin"] = "*"
        response["X-Frame-Options"] = "SAMEORIGIN"
        response["X-Content-Type-Options"] = "nosniff"

        # Cache control for development (disable caching during preview)
        response["Cache-Control"] = "no-cache, no-store, must-revalidate"

        return response


class WebsiteTemplateJSONViewSet(viewsets.ModelViewSet):
    """ViewSet for converted template JSONs"""

    serializer_class = WebsiteTemplateJSONSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WebsiteTemplateJSON.objects.filter(
            created_from_upload__owner=self.request.user
        )
