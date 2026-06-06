import json
import uuid
import logging
import hashlib
import hmac
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
from rest_framework import generics, permissions, status
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

logger = logging.getLogger(__name__)

FW_BASE_URL = "https://api.flutterwave.com/v3"
FW_PUBLIC_KEY = settings.FLUTTERWAVE_PUBLIC_KEY
FW_SECRET_KEY = settings.FLUTTERWAVE_SECRET_KEY
FW_ENCRYPTION_KEY = settings.FLUTTERWAVE_ENCRYPTION_KEY


def generate_transaction_id():
    """Generate unique transaction ID for payments"""
    return f"txn_{uuid.uuid4().hex[:16]}"


def generate_invoice_number():
    """Generate unique invoice number"""
    return f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


def mask_card_number(card_number):
    """Mask card number for display - shows only last 4 digits"""
    if not card_number or len(card_number) < 4:
        return "****"
    return f"**** **** **** {card_number[-4:]}"


def mask_phone_number(phone):
    """Mask phone number for display"""
    if not phone or len(phone) < 4:
        return "****"
    return f"****{phone[-4:]}"


class FlutterwaveConfigView(APIView):
    """Get Flutterwave public key for frontend"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "publicKey": FW_PUBLIC_KEY,
            "baseUrl": FW_BASE_URL,
        })


class PaymentMethodListCreateView(generics.ListCreateAPIView):
    """List and create payment methods for user"""
    serializer_class = None
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List user's payment methods"""
        methods = PaymentMethod.objects.filter(user=request.user)
        data = []
        for m in methods:
            data.append({
                "id": m.id,
                "provider": m.provider,
                "type": m.type,
                "is_default": m.is_default,
                "masked_number": m.masked_number,
                "phone_number": m.phone_number,
                "status": m.status,
                "expiry_month": m.expiry_month,
                "expiry_year": m.expiry_year,
                "card_holder_name": m.card_holder_name,
                "created_at": m.created_at,
            })
        return Response(data)

    def post(self, request):
        """Add new payment method"""
        provider = request.data.get("provider")
        payment_type = request.data.get("type")
        phone_number = request.data.get("phone_number")
        card_number = request.data.get("card_number")
        card_holder_name = request.data.get("card_holder_name")
        expiry_month = request.data.get("expiry_month")
        expiry_year = request.data.get("expiry_year")

        if not provider or not payment_type:
            return Response({"error": "Provider and type required"}, status=status.HTTP_400_BAD_REQUEST)

        if payment_type in ["mtn", "orange"]:
            if not phone_number:
                return Response({"error": "Phone number required for mobile money"}, status=status.HTTP_400_BAD_REQUEST)

            payment_method = PaymentMethod.objects.create(
                user=request.user,
                provider=payment_type,
                type=payment_type,
                phone_number=phone_number,
                masked_number=mask_phone_number(phone_number),
            )
            return Response({"success": True, "method_id": payment_method.id})

        elif payment_type in ["visa", "mastercard", "flutterwave_voucher"]:
            if not card_number:
                return Response({"error": "Card number required"}, status=status.HTTP_400_BAD_REQUEST)

            payment_method = PaymentMethod.objects.create(
                user=request.user,
                provider=payment_type,
                type=payment_type,
                masked_number=mask_card_number(card_number),
                expiry_month=expiry_month,
                expiry_year=expiry_year,
                card_holder_name=card_holder_name,
            )
            return Response({"success": True, "method_id": payment_method.id})

        return Response({"error": "Invalid payment type"}, status=status.HTTP_400_BAD_REQUEST)


class PaymentMethodDetailView(APIView):
    """Manage individual payment method"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        """Update payment method (e.g., set as default)"""
        try:
            method = PaymentMethod.objects.get(id=pk, user=request.user)
        except PaymentMethod.DoesNotExist:
            return Response({"error": "Payment method not found"}, status=status.HTTP_404_NOT_FOUND)

        if request.data.get("is_default") is True:
            PaymentMethod.objects.filter(user=request.user, is_default=True).update(is_default=False)
            method.is_default = True
            method.save()

        return Response({"success": True})

    def delete(self, request, pk):
        """Remove payment method"""
        try:
            method = PaymentMethod.objects.get(id=pk, user=request.user)
            method.status = "removed"
            method.save()
            return Response({"success": True})
        except PaymentMethod.DoesNotExist:
            return Response({"error": "Payment method not found"}, status=status.HTTP_404_NOT_FOUND)


class InitializeFlutterwavePaymentView(APIView):
    """Initialize Flutterwave payment for subscription"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tx_ref = generate_transaction_id()
        plan_slug = request.data.get("plan")
        payment_method = request.data.get("payment_method", "card")
        payment_method_id = request.data.get("payment_method_id")
        phone_number = request.data.get("phone_number")
        network = request.data.get("network")

        try:
            plan = BillingPlan.objects.get(slug=plan_slug, is_active=True)
        except BillingPlan.DoesNotExist:
            return Response({"error": "Invalid plan"}, status=status.HTTP_400_BAD_REQUEST)

        if plan.price == 0:
            return Response({"error": "Free plans don't require payment"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        callback_url = f"{settings.FRONTEND_URL or 'http://localhost:3001'}/billing?success=true"

        payment_payload = {
            "tx_ref": tx_ref,
            "amount": str(plan.price),
            "currency": "USD",
            "payment_options": payment_method,
            "customer": {
                "email": user.email,
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            },
            "meta": {
                "user_id": user.id,
                "plan": plan_slug,
            },
            "redirect_url": callback_url,
        }

        if payment_method == "mobile_money":
            payment_payload["payment_options"] = "mobile_money"
            payment_payload["customer"]["phone_number"] = phone_number

            if network == "mtn":
                payment_payload["networks"] = ["MTN"]
            elif network == "orange":
                payment_payload["networks"] = ["ORANGE"]

            payment_payload["meta"]["network"] = network
        else:
            payment_payload["payment_options"] = "card"

        try:
            response = requests.post(
                f"{FW_BASE_URL}/payments",
                headers={
                    "Authorization": f"Bearer {FW_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                json=payment_payload,
            )
            data = response.json()

            if data.get("status") == "success":
                payment = Payment.objects.create(
                    user=user,
                    amount=plan.price,
                    currency="USD",
                    payment_method=payment_method,
                    mobile_network=network if payment_method == "mobile_money" else None,
                    phone_number=phone_number,
                    status="pending",
                    description=f"Payment for {plan.name} plan",
                    metadata={"tx_ref": tx_ref},
                )

                return Response({
                    "success": True,
                    "payment_id": str(payment.id),
                    "flutterwavePaymentLink": data["data"].get("link"),
                    "tx_ref": tx_ref,
                })

            return Response({"error": data.get("message", "Payment initialization failed")}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Flutterwave payment initialization error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyFlutterwavePaymentView(APIView):
    """Verify Flutterwave payment status"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tx_ref = request.data.get("tx_ref")

        if not tx_ref:
            return Response({"error": "Transaction reference required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = requests.get(
                f"{FW_BASE_URL}/transactions/{tx_ref}/verify",
                headers={"Authorization": f"Bearer {FW_SECRET_KEY}"},
            )
            data = response.json()

            if data.get("status") == "success":
                transaction_data = data.get("data", {})

                if transaction_data.get("status") == "successful":
                    payment = Payment.objects.get(
                        user=request.user,
                        metadata__tx_ref=tx_ref
                    )
                    return Response({
                        "success": True,
                        "status": "successful",
                        "amount": str(payment.amount),
                        "payment_id": str(payment.id),
                    })

            return Response({"success": False, "status": "pending"})
        except Payment.DoesNotExist:
            return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Flutterwave payment verification error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FlutterwaveWebhookView(View):
    """Handle Flutterwave webhooks"""

    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request):
        payload = request.body
        signature = request.META.get("HTTP_VERIF_HASH")

        if not signature:
            return HttpResponse(status=401)

        expected_secret = getattr(settings, "FLUTTERWAVE_WEBHOOK_SECRET", "")
        if expected_secret and signature != expected_secret:
            return HttpResponse(status=403)

        try:
            data = json.loads(payload)
            event_type = data.get("event")
            transaction = data.get("data", {})

            logger.info(f"Received Flutterwave webhook: {event_type}")

            if event_type == "charge.completed":
                self.handle_payment_success(transaction)
            elif event_type == "charge.failed":
                self.handle_payment_failed(transaction)
            elif event_type == "subscription.completed":
                self.handle_subscription_success(transaction)
            elif event_type == "refund.processed":
                self.handle_refund(transaction)

            return HttpResponse(status=200)
        except Exception as e:
            logger.error(f"Flutterwave webhook error: {e}")
            return HttpResponse(status=400)

    def handle_payment_success(self, transaction):
        """Handle successful payment webhook"""
        tx_ref = transaction.get("tx_ref")
        if not tx_ref:
            return

        try:
            with transaction.atomic():
                payment = Payment.objects.get(metadata__tx_ref=tx_ref)
                payment.status = "completed"
                payment.save()

                self.create_invoice(payment, transaction)
                self.upgrade_subscription(payment, transaction)
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for tx_ref: {tx_ref}")

    def handle_payment_failed(self, transaction):
        """Handle failed payment webhook"""
        tx_ref = transaction.get("tx_ref")
        if not tx_ref:
            return

        try:
            payment = Payment.objects.get(metadata__tx_ref=tx_ref)
            payment.status = "failed"
            payment.save()
        except Payment.DoesNotExist:
            pass

    def handle_subscription_success(self, transaction):
        """Handle subscription success webhook"""
        logger.info(f"Subscription success: {transaction}")

    def handle_refund(self, transaction):
        """Handle refund webhook"""
        tx_ref = transaction.get("tx_ref")
        if not tx_ref:
            return

        try:
            payment = Payment.objects.get(metadata__tx_ref=tx_ref)
            payment.status = "refunded"
            payment.save()
        except Payment.DoesNotExist:
            pass

    def create_invoice(self, payment, transaction):
        """Create invoice for completed payment"""
        invoice_number = transaction.get("flw_ref", generate_invoice_number())

        if not Invoice.objects.filter(invoice_number=invoice_number).exists():
            invoice = Invoice.objects.create(
                user=payment.user,
                payment=payment,
                invoice_number=invoice_number,
                amount_due=payment.amount,
                amount_paid=payment.amount,
                currency=payment.currency,
                status="paid",
                paid_at=timezone.now(),
            )

            plan_slug = payment.metadata.get("plan") if payment.metadata else None
            if plan_slug:
                try:
                    plan = BillingPlan.objects.get(slug=plan_slug)
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        description=f"{plan.name} Subscription",
                        quantity=1,
                        unit_amount=payment.amount,
                        amount=payment.amount,
                    )
                except BillingPlan.DoesNotExist:
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        description="Subscription",
                        quantity=1,
                        unit_amount=payment.amount,
                        amount=payment.amount,
                    )

    def upgrade_subscription(self, payment, transaction):
        """Upgrade user subscription after successful payment"""
        plan_slug = payment.metadata.get("plan") if payment.metadata else None
        if not plan_slug:
            return

        try:
            plan = BillingPlan.objects.get(slug=plan_slug, is_active=True)
            user = payment.user

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
            logger.error(f"Plan {plan_slug} not found for subscription upgrade")