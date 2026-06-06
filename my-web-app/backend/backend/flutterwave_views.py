import requests
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
import json
import uuid
from datetime import timedelta

from core.models import Subscription, Payment, Invoice, InvoiceItem, BillingPlan, UserBillingPlan
from core.serializers import (
    PaymentSerializer,
    InvoiceSerializer,
    SubscriptionSerializer,
)

# Initialize Flutterwave
FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"
FLUTTERWAVE_SECRET_KEY = getattr(settings, 'FLUTTERWAVE_SECRET_KEY', '')
FLUTTERWAVE_PUBLIC_KEY = getattr(settings, 'FLUTTERWAVE_PUBLIC_KEY', '')
FLUTTERWAVE_ENCRYPTION_KEY = getattr(settings, 'FLUTTERWAVE_ENCRYPTION_KEY', '')


class FlutterwaveConfigView(APIView):
    """Get Flutterwave public key for frontend"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "publicKey": settings.FLUTTERWAVE_PUBLIC_KEY,
            "encryptionKey": settings.FLUTTERWAVE_ENCRYPTION_KEY
        })


class InitializeFlutterwavePaymentView(APIView):
    """Initialize Flutterwave payment for Mobile Money"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            plan_slug = data.get("plan")
            payment_method = data.get("paymentMethod", "mobile_money")  # mobile_money, card, etc.
            network = data.get("network", "mtn")  # mtn, orange, etc.
            phone_number = data.get("phoneNumber")
            email = data.get("email", request.user.email)
            fullname = data.get("fullname", f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username)

            if not plan_slug:
                return Response({"error": "Plan is required"}, status=status.HTTP_400_BAD_REQUEST)

            if not phone_number:
                return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Look up the billing plan from database
            billing_plan = BillingPlan.objects.filter(slug=plan_slug, is_active=True).first()
            if not billing_plan:
                return Response({"error": "Invalid or inactive plan"}, status=status.HTTP_400_BAD_REQUEST)

            # Get or create subscription
            subscription, created = Subscription.objects.get_or_create(
                user=request.user, defaults={"plan": "free"}
            )

            # Prepare Flutterwave payload
            flutterwave_payload = {
                "tx_ref": f"waas-{request.user.id}-{uuid.uuid4()}",
                "amount": str(billing_plan.price),
                "currency": "USD",
                "payment_options": "mobilemoneyghana,mobilemoneyuganda,mobilemoneyrwanda,mobilemoneyzambia,mobilemoney",
                "redirect_url": f"{settings.FRONTEND_URL or 'http://localhost:3001'}/billing?flutterwave_status=success",
                "customer": {
                    "email": email,
                    "phonenumber": phone_number,
                    "name": fullname
                },
                "customizations": {
                    "title": "WaaS Subscription",
                    "description": f"Payment for {billing_plan.name} Plan",
                    "logo": "https://yourdomain.com/logo.png"
                }
            }

            # Add network-specific options if needed
            if network.lower() in ['mtn', 'orange']:
                flutterwave_payload["payment_options"] = "mobilemoneyghana"  # Simplified for demo

            headers = {
                "Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}",
                "Content-Type": "application/json"
            }

            # Initialize transaction with Flutterwave
            response = requests.post(
                f"{FLUTTERWAVE_BASE_URL}/payments",
                json=flutterwave_payload,
                headers=headers
            )

            if response.status_code != 200:
                return Response({
                    "error": "Failed to initialize payment with Flutterwave",
                    "details": response.json()
                }, status=status.HTTP_400_BAD_REQUEST)

            flutterwave_response = response.json()

            if flutterwave_response.get("status") != "success":
                return Response({
                    "error": "Flutterwave payment initialization failed",
                    "details": flutterwave_response
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create pending payment record
            payment = Payment.objects.create(
                user=request.user,
                amount=billing_plan.price,
                currency="USD",
                payment_method="mobile_money",
                mobile_network=network,
                phone_number=phone_number,
                status="pending",
                stripe_payment_intent_id=flutterwave_response["data"]["id"],
                description=f"Subscription to {billing_plan.name} Plan via Flutterwave ({network})",
            )

            return Response({
                "success": True,
                "paymentId": str(payment.id),
                "flutterwavePaymentLink": flutterwave_response["data"]["link"],
                "amount": float(billing_plan.price),
                "currency": "USD",
                "planName": billing_plan.name,
                "message": "Please complete the payment using the link provided"
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyFlutterwavePaymentView(APIView):
    """Verify Flutterwave payment status"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            transaction_id = data.get("transaction_id") or data.get("id")
            plan_slug = data.get("plan")

            if not transaction_id:
                return Response({"error": "Transaction ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Verify transaction with Flutterwave
            headers = {
                "Authorization": f"Bearer {FLUTTERWAVE_SECRET_KEY}",
                "Content-Type": "application/json"
            }

            response = requests.get(
                f"{FLUTTERWAVE_BASE_URL}/transactions/{transaction_id}/verify",
                headers=headers
            )

            if response.status_code != 200:
                return Response({
                    "error": "Failed to verify payment with Flutterwave",
                    "details": response.json()
                }, status=status.HTTP_400_BAD_REQUEST)

            flutterwave_response = response.json()

            if flutterwave_response.get("status") != "success":
                return Response({
                    "error": "Flutterwave payment verification failed",
                    "details": flutterwave_response
                }, status=status.HTTP_400_BAD_REQUEST)

            transaction_data = flutterwave_response["data"]

            # Check if transaction was successful
            if transaction_data["status"] != "successful":
                # Update payment as failed
                try:
                    payment = Payment.objects.get(
                        stripe_payment_intent_id=transaction_id,
                        user=request.user,
                        status="pending"
                    )
                    payment.status = "failed"
                    payment.save()
                except Payment.DoesNotExist:
                    pass

                return Response({
                    "success": False,
                    "status": transaction_data["status"],
                    "message": "Payment was not successful"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Payment successful - update records
            with transaction.atomic():
                # Update payment record
                payment = Payment.objects.get(
                    stripe_payment_intent_id=transaction_id,
                    user=request.user
                )
                payment.status = "completed"
                payment.save()

                subscription = payment.user.subscription
                subscription.plan = transaction_data.get("customizations", {}).get("description", "premium").split()[0].lower() or "premium"
                subscription.status = "active"
                subscription.current_period_start = timezone.now()
                subscription.current_period_end = timezone.now() + timedelta(days=30)
                subscription.save()

                # Update user's billing plan
                try:
                    billing_plan = BillingPlan.objects.filter(
                        name__icontains=subscription.plan, is_active=True
                    ).first()
                    if not billing_plan:
                        # Fallback to finding by slug
                        billing_plan = BillingPlan.objects.filter(
                            slug=subscription.plan, is_active=True
                        ).first()

                    user_billing_plan, _ = UserBillingPlan.objects.get_or_create(
                        user=request.user
                    )
                    if billing_plan:
                        user_billing_plan.plan = billing_plan
                    user_billing_plan.has_selected_plan = True
                    user_billing_plan.selected_at = timezone.now()
                    user_billing_plan.save()
                except Exception as e:
                    # Log error but continue
                    pass

                # Create invoice
                invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
                invoice = Invoice.objects.create(
                    user=request.user,
                    payment=payment,
                    invoice_number=invoice_number,
                    amount_due=payment.amount,
                    amount_paid=payment.amount,
                    currency=payment.currency,
                    status="paid",
                    description=payment.description,
                    paid_at=timezone.now(),
                )

                # Create invoice item
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=f"{subscription.plan.capitalize()} Plan - Monthly Subscription (Flutterwave)",
                    quantity=1,
                    unit_amount=payment.amount,
                    amount=payment.amount,
                )

            return Response({
                "success": True,
                "status": "success",
                "message": "Payment verified successfully",
                "invoice": {
                    "id": str(invoice.id),
                    "number": invoice.invoice_number,
                    "amount": float(invoice.amount_due),
                    "status": invoice.status
                }
            })

        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment record not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class FlutterwaveWebhookView(View):
    """Handle Flutterwave webhooks"""

    def post(self, request):
        try:
            # Verify webhook signature (Flutterwave uses SHA512 hash)
            # For simplicity, we'll skip signature verification in this example
            # In production, you should verify the signature using FLUTTERWAVE_WEBHOOK_SECRET
            
            payload = json.loads(request.body.decode('utf-8'))
            
            # Flutterwave webhook structure
            event_type = payload.get("event")
            transaction_data = payload.get("data", {})

            if event_type == "charge.completed":
                self.handle_charge_completed(transaction_data)
            elif event_type == "charge.failed":
                self.handle_charge_failed(transaction_data)

            return JsonResponse({"status": "success"}, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def handle_charge_completed(self, transaction_data):
        """Handle successful Flutterwave payment"""
        try:
            transaction_id = transaction_data.get("id")
            if not transaction_id:
                return

            payment = Payment.objects.get(
                stripe_payment_intent_id=transaction_id,
                payment_method="mobile_money",
                status="pending"
            )
            
            payment.status = "completed"
            payment.save()

            # Update subscription and create invoice (similar to verification view)
            subscription = payment.user.subscription
            subscription.plan = transaction_data.get("customizations", {}).get("description", "premium").split()[0].lower() or "premium"
            subscription.status = "active"
            subscription.current_period_start = timezone.now()
            subscription.current_period_end = timezone.now() + timedelta(days=30)
            subscription.save()

            # Update user's billing plan
            try:
                billing_plan = BillingPlan.objects.filter(
                    name__icontains=subscription.plan, is_active=True
                ).first()
                if not billing_plan:
                    billing_plan = BillingPlan.objects.filter(
                        slug=subscription.plan, is_active=True
                    ).first()

                user_billing_plan, _ = UserBillingPlan.objects.get_or_create(
                    user=payment.user
                )
                if billing_plan:
                    user_billing_plan.plan = billing_plan
                user_billing_plan.has_selected_plan = True
                user_billing_plan.selected_at = timezone.now()
                user_billing_plan.save()
            except Exception as e:
                pass

            # Create invoice
            import uuid
            invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            invoice = Invoice.objects.create(
                user=payment.user,
                payment=payment,
                invoice_number=invoice_number,
                amount_due=payment.amount,
                amount_paid=payment.amount,
                currency=payment.currency,
                status="paid",
                description=payment.description,
                paid_at=timezone.now(),
            )

            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"{subscription.plan.capitalize()} Plan - Monthly Subscription (Flutterwave Webhook)",
                quantity=1,
                unit_amount=payment.amount,
                amount=payment.amount,
            )
            
        except Payment.DoesNotExist:
            pass  # Payment record not found or already processed
        except Exception as e:
            # Log error but don't fail webhook
            pass

    def handle_charge_failed(self, transaction_data):
        """Handle failed Flutterwave payment"""
        try:
            transaction_id = transaction_data.get("id")
            if not transaction_id:
                return

            payment = Payment.objects.get(
                stripe_payment_intent_id=transaction_id,
                payment_method="mobile_money",
                status="pending"
            )
            
            payment.status = "failed"
            payment.save()
            
        except Payment.DoesNotExist:
            pass
        except Exception as e:
            pass