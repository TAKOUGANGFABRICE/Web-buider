import json
import uuid
import logging
from decimal import Decimal
from datetime import timedelta

import requests
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import (
    BillingPlan,
    Payment,
    Invoice,
    InvoiceItem,
    Subscription,
    PaymentMethod,
    UserBillingPlan,
    Website,
)
from core.serializers import PaymentSerializer, InvoiceSerializer, PaymentMethodSerializer

logger = logging.getLogger(__name__)


def generate_transaction_id():
    """Generate unique transaction ID for payments"""
    return f"txn_{uuid.uuid4().hex[:16]}"


def generate_invoice_number():
    """Generate unique invoice number"""
    return f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


class StripeConfigView(APIView):
    """Get Stripe public key for frontend"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "publishableKey": settings.STRIPE_PUBLISHABLE_KEY,
            "successUrl": settings.STRIPE_SUCCESS_URL,
            "cancelUrl": settings.STRIPE_CANCEL_URL,
        })


class CreatePaymentIntentView(APIView):
    """Create a Stripe payment intent for subscription upgrade"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY

        plan_slug = request.data.get("plan")
        billing_period = request.data.get("billing_period", "monthly")

        try:
            plan = BillingPlan.objects.get(slug=plan_slug, is_active=True)
        except BillingPlan.DoesNotExist:
            return Response({"error": "Invalid plan"}, status=status.HTTP_400_BAD_REQUEST)

        if plan.price == 0:
            return Response({"error": "Free plans don't require payment"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(plan.price * 100),
                currency="usd",
                automatic_payment_methods={"enabled": True},
                metadata={
                    "user_id": str(request.user.id),
                    "plan": plan_slug,
                    "billing_period": billing_period,
                }
            )

            Payment.objects.create(
                user=request.user,
                amount=plan.price,
                currency="USD",
                payment_method="card",
                status="pending",
                stripe_payment_intent_id=intent.id,
                description=f"Subscription upgrade to {plan.name}",
            )

            return Response({
                "clientSecret": intent.client_secret,
                "amount": str(plan.price),
                "currency": "USD",
            })
        except Exception as e:
            logger.error(f"Stripe payment intent error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentHistoryView(generics.ListAPIView):
    """List user's payment history"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')


class ConfirmPaymentView(APIView):
    """Confirm Stripe payment after completion"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY

        payment_intent_id = request.data.get("payment_intent_id")

        if not payment_intent_id:
            return Response({"error": "Payment intent ID required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            if intent.status == "succeeded":
                with transaction.atomic():
                    payment = Payment.objects.filter(
                        user=request.user,
                        stripe_payment_intent_id=payment_intent_id
                    ).first()
                    if payment:
                        payment.status = "completed"
                        payment.save()

                plan_slug = intent.metadata.get("plan", "basic")
                self.upgrade_user_subscription(request.user, plan_slug)
                invoice = self.create_invoice(payment)

                return Response({
                    "success": True,
                    "payment_id": str(payment.id),
                    "invoice_id": str(invoice.id) if invoice else None,
                })

            return Response({"error": "Payment not completed"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Payment confirmation error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def upgrade_user_subscription(self, user, plan_slug):
        """Upgrade user's subscription to the new plan"""
        try:
            plan = BillingPlan.objects.get(slug=plan_slug, is_active=True)
            user_billing, _ = UserBillingPlan.objects.get_or_create(user=user)
            user_billing.plan = plan
            user_billing.has_selected_plan = True
            user_billing.selected_at = timezone.now()
            user_billing.save()

            subscription, _ = Subscription.objects.get_or_create(user=user)
            subscription.plan = plan_slug
            subscription.status = "active"
            subscription.current_period_start = timezone.now()
            subscription.current_period_end = timezone.now() + timedelta(days=30)
            subscription.save()
        except BillingPlan.DoesNotExist:
            logger.error(f"Plan {plan_slug} not found")

    def create_invoice(self, payment):
        """Create invoice for completed payment"""
        if not payment:
            return None
        invoice = Invoice.objects.create(
            user=payment.user,
            payment=payment,
            invoice_number=generate_invoice_number(),
            amount_due=payment.amount,
            amount_paid=payment.amount,
            currency=payment.currency,
            status="paid",
            paid_at=timezone.now(),
        )

        plan = BillingPlan.objects.filter(slug__iexact=payment.description.replace("Subscription upgrade to ", "").lower()).first()
        if plan:
            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"{plan.name} Plan Subscription",
                quantity=1,
                unit_amount=payment.amount,
                amount=payment.amount,
            )

        return invoice


class MobileMoneyPaymentView(APIView):
    """Initiate mobile money payment via Flutterwave"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_slug = request.data.get("plan")
        network = request.data.get("network")
        phone_number = request.data.get("phone_number")

        if not all([plan_slug, network, phone_number]):
            return Response({"error": "Plan, network, and phone number required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = BillingPlan.objects.get(slug=plan_slug, is_active=True)
        except BillingPlan.DoesNotExist:
            return Response({"error": "Invalid plan"}, status=status.HTTP_400_BAD_REQUEST)

        if plan.price == 0:
            return Response({"error": "Free plans don't require payment"}, status=status.HTTP_400_BAD_REQUEST)

        network_map = {
            "mtn": "MTN",
            "orange": "ORANGE",
        }

        if network.lower() not in network_map:
            return Response({"error": "Invalid network. Use 'mtn' or 'orange'"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.create(
                user=request.user,
                amount=plan.price,
                currency="USD",
                payment_method="mobile_money",
                mobile_network=network.lower(),
                phone_number=phone_number,
                status="pending",
                description=f"Mobile Money payment for {plan.name}",
            )

            return Response({
                "success": True,
                "payment_id": str(payment.id),
                "amount": str(plan.price),
                "message": f"Payment initiated via {network_map[network.lower()]}. Please complete on your phone.",
            })
        except Exception as e:
            logger.error(f"Mobile money payment error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyMobilePaymentView(APIView):
    """Verify mobile money payment"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tx_ref = request.data.get("tx_ref")

        if not tx_ref:
            return Response({"error": "Transaction reference required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.get(
                user=request.user,
                metadata__tx_ref=tx_ref
            )
            return Response({
                "status": payment.status,
                "amount": str(payment.amount),
            })
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)


class InvoiceListView(generics.ListAPIView):
    """List user's invoices"""
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user).order_by("-created_at")


class InvoiceDetailView(generics.RetrieveAPIView):
    """Get invoice details"""
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "invoice_id"

    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user)


class SubscriptionDetailView(generics.RetrieveUpdateAPIView):
    """Get user's subscription details"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subscription, _ = Subscription.objects.get_or_create(user=request.user)
        user_billing, _ = UserBillingPlan.objects.get_or_create(user=request.user)

        plan = user_billing.plan if user_billing.plan else None
        websites_count = Website.objects.filter(owner=request.user).count()

        return Response({
            "id": subscription.id,
            "plan": subscription.plan,
            "plan_name": plan.name if plan else "Free",
            "plan_price": str(plan.price) if plan else "0",
            "status": subscription.status,
            "current_period_start": subscription.current_period_start,
            "current_period_end": subscription.current_period_end,
            "websites_used": websites_count,
            "websites_limit": plan.max_websites if plan and plan.max_websites > 0 else -1,
            "storage_used_gb": 0,
            "storage_limit_gb": plan.disk_space_gb if plan else 5,
            "can_upgrade": True,
            "can_cancel": subscription.plan != "free",
        })


class CancelSubscriptionView(APIView):
    """Cancel user's subscription"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        subscription, _ = Subscription.objects.get_or_create(user=request.user)

        if subscription.plan == "free":
            return Response({"error": "Cannot cancel free plan"}, status=status.HTTP_400_BAD_REQUEST)

        subscription.status = "cancelled"
        subscription.save()

        user_billing = UserBillingPlan.objects.get(user=request.user)
        free_plan = BillingPlan.objects.get(slug="free")
        user_billing.plan = free_plan
        user_billing.save()

        return Response({
            "success": True,
            "message": f"Subscription cancelled. You'll have access until {subscription.current_period_end}",
        })


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(View):
    """Handle Stripe webhooks"""

    def post(self, request):
        import stripe
        from django.contrib.auth.models import User

        stripe.api_key = settings.STRIPE_SECRET_KEY
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        logger.info(f"Received Stripe webhook: {event['type']}")

        if event["type"] == "payment_intent.succeeded":
            self.handle_payment_success(event["data"]["object"])
        elif event["type"] == "invoice.payment_succeeded":
            self.handle_invoice_payment(event["data"]["object"])

        return HttpResponse(status=200)

    def handle_payment_success(self, payment_intent):
        """Handle successful payment"""
        with transaction.atomic():
            payment = Payment.objects.filter(
                stripe_payment_intent_id=payment_intent["id"]
            ).first()

            if payment:
                payment.status = "completed"
                payment.save()
                self.upgrade_subscription(payment)

    def handle_invoice_payment(self, invoice):
        """Handle invoice payment"""
        logger.info(f"Invoice payment: {invoice['id']}")

    def upgrade_subscription(self, payment):
        """Upgrade user subscription based on payment metadata"""
        plan_slug = payment.metadata.get("plan") if hasattr(payment, 'metadata') else None
        if plan_slug:
            try:
                user = payment.user
                plan = BillingPlan.objects.get(slug=plan_slug)
                subscription, _ = Subscription.objects.get_or_create(user=user)
                subscription.plan = plan_slug
                subscription.status = "active"
                subscription.save()
            except (BillingPlan.DoesNotExist, User.DoesNotExist):
                pass