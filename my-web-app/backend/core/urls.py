from django.urls import path
from django.shortcuts import render


def website_view(request):
    """Render the frontend website"""
    return render(request, "website/index.html")


def about_view(request):
    """Render about page"""
    return render(request, "website/about.html")


urlpatterns = [
    path("", website_view, name="website"),
    path("about/", about_view, name="about"),
]
