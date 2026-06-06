from rest_framework import generics, permissions, viewsets
from django.contrib.auth.models import User
from .models import Website
from .serializers import UserSerializer, RegisterSerializer, WebsiteSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

# NOTE: This file appears to contain a minimal WebsiteViewSet used in some older routing.
# The main implementation for WebsiteCRUDView and the WebsiteViewSet routes is in core/crud_views.py.
# Keeping this viewset for backward compatibility.

class WebsiteViewSet(viewsets.ModelViewSet):
    serializer_class = WebsiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Website.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

