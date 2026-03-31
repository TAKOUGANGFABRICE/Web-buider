from django.contrib import admin
from .models import (
    BillingPlan, BillingPlanFeature, UserBillingPlan,
    Template, UserTemplate, TemplatePurchase, TemplateOrder,
    Website, Subscription, Payment, Invoice, InvoiceItem
)


@admin.register(BillingPlan)
class BillingPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'price', 'billing_period', 'is_active', 'created_at']
    list_filter = ['is_active', 'billing_period']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BillingPlanFeature)
class BillingPlanFeatureAdmin(admin.ModelAdmin):
    list_display = ['plan', 'feature_name', 'is_included']
    list_filter = ['plan', 'is_included']


@admin.register(UserBillingPlan)
class UserBillingPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'has_selected_plan', 'selected_at', 'created_at']
    list_filter = ['has_selected_plan', 'plan']
    search_fields = ['user__username']


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'category', 'price', 'is_free', 'is_premium', 'is_active']
    list_filter = ['category', 'is_free', 'is_premium', 'is_active']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(UserTemplate)
class UserTemplateAdmin(admin.ModelAdmin):
    list_display = ['user', 'template', 'name', 'purchased_at']
    list_filter = ['template', 'purchased_at']
    search_fields = ['user__username', 'name']


@admin.register(TemplatePurchase)
class TemplatePurchaseAdmin(admin.ModelAdmin):
    list_display = ['user', 'template', 'amount', 'payment_status', 'created_at']
    list_filter = ['payment_status', 'created_at']
    search_fields = ['user__username']


@admin.register(TemplateOrder)
class TemplateOrderAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'order_type', 'status', 'quoted_price', 'created_at']
    list_filter = ['order_type', 'status', 'created_at']
    search_fields = ['user__username', 'title', 'description']


admin.site.register(Website)
admin.site.register(Subscription)
admin.site.register(Payment)
admin.site.register(Invoice)
admin.site.register(InvoiceItem)
