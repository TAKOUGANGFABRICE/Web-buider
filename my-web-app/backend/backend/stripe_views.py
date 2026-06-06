import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import timedelta
import json
import logging

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

PLAN_PRICE_ID_MAP = {
    "price_premium": "premium",
    "price_business": "business",
    "price_pro": "pro",
    "price_enterprise": "enterprise",
}


def get_plan_from_price_id(price_id):
    """Map Stripe price ID to internal plan name"""
    price_id_map = {
        settings.STRIPE_PREMIUM_PRICE_ID: "basic",
        settings.STRIPE_BUSINESS_PRICE_ID: "business",
    }
    return price_id_map.get(price_id, "basic")


def fulfill_stripe_purchase(user_email, plan_name):
    """Fulfill the purchase by upgrading user's billing plan"""
    try:
        user = User.objects.get(email=user_email)
    except User.DoesNotExist:
        logger.error(f"User not found with email: {user_email}")
        return False

    from core.models import BillingPlan, UserBillingPlan, Subscription

    try:
        billing_plan = BillingPlan.objects.get(slug=plan_name, is_active=True)
    except BillingPlan.DoesNotExist:
        logger.error(f"Billing plan not found: {plan_name}")
        billing_plan = None

    with timezone.now().tzname(None):
        user_billing_plan, _ = UserBillingPlan.objects.get_or_create(user=user)
        if billing_plan:
            user_billing_plan.plan = billing_plan
            user_billing_plan.has_selected_plan = True
            user_billing_plan.selected_at = timezone.now()
            user_billing_plan.save()

        subscription, _ = Subscription.objects.get_or_create(user=user)
        subscription.plan = plan_name
        subscription.status = "active"
        subscription.current_period_start = timezone.now()
        subscription.current_period_end = timezone.now() + timedelta(days=30)
        subscription.save()

    logger.info(f"Successfully upgraded user {user.username} to {plan_name} plan")
    return True


@method_decorator(csrf_exempt, name="dispatch")
class StripeCheckoutSessionView(View):
    def post(self, request):
        data = json.loads(request.body)
        plan_slug = data.get("plan", "basic")
        period = data.get("period", "monthly")  # default to monthly

        from core.models import BillingPlan

        try:
            billing_plan = BillingPlan.objects.get(slug=plan_slug, is_active=True)
        except BillingPlan.DoesNotExist:
            return JsonResponse({"error": "Invalid or inactive plan"}, status=400)

        # Use the plan's Stripe price ID if configured
        price_id = billing_plan.stripe_price_id
        if not price_id:
            return JsonResponse({"error": f"Stripe price ID not configured for plan {plan_slug}"}, status=400)

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=settings.STRIPE_SUCCESS_URL,
                cancel_url=settings.STRIPE_CANCEL_URL,
                metadata={
                    "plan": plan_slug,
                    "period": period,
                },
            )
            return JsonResponse({"id": session.id, "url": session.url})
        except Exception as e:
            logger.error(f"Stripe checkout error: {e}")
            return JsonResponse({"error": str(e)}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(View):
    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
        event = None
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            self.fulfill_checkout_session(session)
        elif event["type"] == "customer.subscription.created":
            subscription = event["data"]["object"]
            self.handle_subscription_created(subscription)
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            self.handle_subscription_cancelled(subscription)

        return HttpResponse(status=200)

    def fulfill_checkout_session(self, session):
        """Fulfill the checkout session by upgrading user's plan"""
        try:
            customer_email = session.get("customer_email")
            customer_id = session.get("customer")
            plan = session.get("metadata", {}).get("plan", "basic")

            if not customer_email and customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                customer_email = customer.get("email")

            if customer_email:
                fulfill_stripe_purchase(customer_email, plan)
            else:
                logger.error("No customer email found in checkout session")
        except Exception as e:
            logger.error(f"Error fulfilling checkout session: {e}")

    def handle_subscription_created(self, subscription):
        """Handle new Stripe subscription"""
        try:
            customer_id = subscription.get("customer")
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                user_email = customer.get("email")
                if user_email:
                    user = User.objects.get(email=user_email)
                    from core.models import Subscription

                    sub, _ = Subscription.objects.get_or_create(user=user)
                    sub.stripe_subscription_id = subscription.get("id")
                    sub.status = "active"
                    sub.save()
        except Exception as e:
            logger.error(f"Error handling subscription created: {e}")

    def handle_subscription_cancelled(self, subscription):
        """Handle cancelled Stripe subscription"""
        try:
            customer_id = subscription.get("customer")
            if customer_id:
                customer = stripe.Customer.retrieve(customer_id)
                user_email = customer.get("email")
                if user_email:
                    user = User.objects.get(email=user_email)
                    from core.models import Subscription

                    sub = Subscription.objects.filter(user=user).first()
                    if sub:
                        sub.status = "cancelled"
                        sub.save()
        except Exception as e:
            logger.error(f"Error handling subscription cancelled: {e}")
