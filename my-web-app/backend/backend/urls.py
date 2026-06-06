from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from core.views import SitemapView, RobotsTxtView


def api_root(request):
    return JsonResponse(
        {
            "message": "WaaS API Server",
            "version": "1.0",
            "endpoints": {"api": "/api/", "admin": "/admin/", "docs": "/api/docs/"},
        }
    )


urlpatterns = [
    path("", api_root, name="root"),
    path("website/", include("core.urls")),  # Add your website URLs
    path("admin/", admin.site.urls),
    path("api/", include("backend.api_urls")),
    path("api/crud/", include("backend.crud_urls")),
    path("sitemap.xml", SitemapView.as_view(), name="sitemap"),
    path("robots.txt", RobotsTxtView.as_view(), name="robots-txt"),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
