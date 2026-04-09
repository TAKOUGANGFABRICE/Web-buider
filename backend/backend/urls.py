from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("backend.api_urls")),
    path("api/crud/", include("backend.crud_urls")),
]
