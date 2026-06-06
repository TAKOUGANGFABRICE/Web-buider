"""
Billing Plan Feature Checker Utility

This module provides functions to check and enforce billing plan features
across the application.
"""

from django.utils.translation import gettext_lazy as _
from core.models import UserBillingPlan, Website, Template, UserTemplate, CustomWebsiteUpload
from rest_framework.exceptions import PermissionDenied


def get_user_plan(user):
    """Get the current user's billing plan"""
    if not user.is_authenticated:
        return None
    try:
        user_plan = UserBillingPlan.objects.select_related("plan").get(user=user)
        return user_plan.plan if user_plan.plan else None
    except UserBillingPlan.DoesNotExist:
        return None


def get_plan_limits(plan):
    """Get plan limits as a dictionary"""
    if not plan:
        return {
            "max_websites": 1,
            "max_templates_access": 0,
            "can_use_custom_domain": False,
            "can_remove_branding": False,
            "can_access_api": False,
            "can_have_team_members": False,
            "max_team_members": 0,
            "has_priority_support": False,
            "has_analytics": False,
            "has_white_label": False,
            "can_order_custom_template": False,
        }

    return {
        "max_websites": plan.max_websites,
        "max_templates_access": plan.max_templates_access,
        "can_use_custom_domain": plan.can_use_custom_domain,
        "can_remove_branding": plan.can_remove_branding,
        "can_access_api": plan.can_access_api,
        "can_have_team_members": plan.can_have_team_members,
        "max_team_members": plan.max_team_members,
        "has_priority_support": plan.has_priority_support,
        "has_analytics": plan.has_analytics,
        "has_white_label": plan.has_white_label,
        "can_order_custom_template": plan.can_order_custom_template,
    }


def enforce_plan_limit(value, limit, feature_name, free_tier_value=None):
    """Generic helper to enforce plan limits with consistent error messages"""
    if limit == -1:  # Unlimited
        return True
    
    if free_tier_value is not None and value >= free_tier_value:
        return True
    
    if value > limit:
        raise PermissionDenied(
            _(f"Your plan limits exceeded for {feature_name}. Maximum allowed: {limit}")
        )
    return True


def check_website_limit(user):
    """Check if user can create more websites"""
    plan = get_user_plan(user)
    if not plan:
        # Allow 1 website for users without a plan (free tier)
        current_websites = Website.objects.filter(owner=user).count()
        if current_websites >= 1:
            return {
                "allowed": False,
                "message": "Please select a billing plan to create more websites",
                "current": current_websites,
                "max": 1,
            }
        return {
            "allowed": True,
            "current": current_websites,
            "max": 1,
        }

    current_websites = Website.objects.filter(owner=user).count()
    max_websites = plan.max_websites

    if max_websites == -1:  # Unlimited
        return {"allowed": True, "current": current_websites, "max": "Unlimited"}

    if current_websites >= max_websites:
        return {
            "allowed": False,
            "message": f"You have reached the maximum of {max_websites} websites. Upgrade your plan to create more.",
            "current": current_websites,
            "max": max_websites,
        }

    return {"allowed": True, "current": current_websites, "max": max_websites}


def check_custom_domain(user):
    """Check if user can use custom domains"""
    plan = get_user_plan(user)
    if not plan:
        return False
    return plan.can_use_custom_domain


def check_team_members(user):
    """Check if user can have team members and max count"""
    plan = get_user_plan(user)
    if not plan:
        return {"allowed": False, "max": 0}
    return {"allowed": plan.can_have_team_members, "max": plan.max_team_members}


def check_template_access(user, template):
    """
    Check if user can access a specific template.
    Returns: (allowed: bool, reason: str or None)
    """
    plan = get_user_plan(user)
    
    # Free templates are available to all
    if template.is_free:
        return True, None

    # Check if template requires specific plan
    if template.required_plan:
        if plan and plan.price >= template.required_plan.price:
            return True, None
        return False, f"Template requires {template.required_plan.name} plan or higher"

    # Check plan's template access limit
    if not plan:
        return False, "A billing plan is required to access premium templates"

    if plan.max_templates_access == -1:  # All templates
        return True, None

    # Check how many premium templates user has already purchased (free templates excluded)
    owned_count = UserTemplate.objects.filter(user=user, template__is_free=False).count()
    if owned_count >= plan.max_templates_access:
        return False, f"You have reached your plan's template limit ({plan.max_templates_access}). Upgrade to access more premium templates."

    return True, None


def check_api_access(user):
    """Check if user has API access"""
    plan = get_user_plan(user)
    if not plan:
        return False
    return plan.can_access_api


def check_custom_template_order(user):
    """Check if user can order custom templates"""
    plan = get_user_plan(user)
    if not plan:
        return False
    return plan.can_order_custom_template


def check_analytics(user):
    """Check if user has analytics access"""
    plan = get_user_plan(user)
    if not plan:
        return False
    return plan.has_analytics


def check_white_label(user):
    """Check if user has white label features"""
    plan = get_user_plan(user)
    if not plan:
        return False
    return plan.has_white_label


def check_branding_removal(user):
    """Check if user can remove branding from their websites"""
    plan = get_user_plan(user)
    if not plan:
        return False
    return plan.can_remove_branding


def get_feature_list(user):
    """Get list of features available to user"""
    plan = get_user_plan(user)
    if not plan:
        return []
    return plan.get_feature_list()


def check_storage_usage(user, additional_bytes=0):
    """
    Check if user has exceeded their disk space limit.
    Returns: (allowed: bool, current_usage: int, limit_bytes: int, message: str or None)
    """
    from django.db.models import Sum
    from core.models import CustomWebsiteUpload
    
    plan = get_user_plan(user)
    if not plan:
        limit_gb = 5
    else:
        limit_gb = plan.disk_space_gb
    
    limit_bytes = limit_gb * 1024 * 1024 * 1024
    
    used_bytes = CustomWebsiteUpload.objects.filter(owner=user).aggregate(
        total=Sum('file_size')
    )['total'] or 0
    
    projected_total = used_bytes + additional_bytes
    
    if projected_total > limit_bytes:
        used_gb = used_bytes / (1024**3)
        limit_gb_display = "Unlimited" if limit_gb == -1 else f"{limit_gb} GB"
        return (
            False,
            used_bytes,
            limit_bytes,
            f"Storage limit exceeded: {used_gb:.2f} GB used of {limit_gb_display}"
        )
    
    return True, used_bytes, limit_bytes, None


def check_plan_limit(value, limit, feature_name, free_tier_value=None):
    """Generic helper to enforce plan limits with consistent error messages"""
    if limit == -1:  # Unlimited
        return True
    
    if free_tier_value is not None and value >= free_tier_value:
        return True
    
    if value > limit:
        raise PermissionDenied(
            _(f"Your plan limits exceeded for {feature_name}. Maximum allowed: {limit}")
        )
    return True


def get_plan_info(user):
    """Get comprehensive plan information for a user"""
    plan = get_user_plan(user)
    limits = get_plan_limits(plan)

    website_check = check_website_limit(user)

    return {
        "plan": plan.name if plan else "None",
        "plan_slug": plan.slug if plan else None,
        "has_plan": plan is not None,
        "limits": limits,
        "website_count": website_check["current"],
        "website_limit": website_check["max"],
        "can_create_website": website_check["allowed"],
    }
