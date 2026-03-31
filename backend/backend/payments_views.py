import stripe
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
from datetime import datetime, timedelta
import json
import uuid

from core.models import Subscription, Payment, Invoice, InvoiceItem
from core.serializers import PaymentSerializer, InvoiceSerializer, SubscriptionSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeConfigView(APIView):
    """Get Stripe publishable key for frontend"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'publishableKey': settings.STRIPE_PUBLISHABLE_KEY
        })


class CreatePaymentIntentView(APIView):
    """Create a Stripe PaymentIntent for card payments"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            plan = data.get('plan', 'premium')
            
            # Plan pricing
            plan_prices = {
                'premium': 1000,  # $10.00 in cents
                'business': 2900,  # $29.00 in cents
            }
            
            amount = plan_prices.get(plan, 1000)
            
            # Get or create Stripe customer
            subscription, created = Subscription.objects.get_or_create(
                user=request.user,
                defaults={'plan': 'free'}
            )
            
            if not subscription.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                )
                subscription.stripe_customer_id = customer.id
                subscription.save()
            
            # Create PaymentIntent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',
                customer=subscription.stripe_customer_id,
                automatic_payment_methods={'enabled': True},
                metadata={
                    'user_id': str(request.user.id),
                    'plan': plan,
                    'username': request.user.username,
                }
            )
            
            # Create pending payment record
            payment = Payment.objects.create(
                user=request.user,
                subscription=subscription,
                amount=amount / 100,  # Convert cents to dollars
                currency='USD',
                payment_method='card',
                stripe_payment_intent_id=payment_intent.id,
                status='pending',
                description=f'Subscription to {plan.capitalize()} Plan'
            )
            
            return Response({
                'clientSecret': payment_intent.client_secret,
                'paymentId': str(payment.id)
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ConfirmPaymentView(APIView):
    """Confirm payment and create/update subscription"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            payment_id = data.get('paymentId')
            plan = data.get('plan', 'premium')
            
            with transaction.atomic():
                payment = Payment.objects.get(id=payment_id, user=request.user)
                
                # Retrieve the PaymentIntent from Stripe
                intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)
                
                if intent.status == 'succeeded':
                    payment.status = 'completed'
                    payment.stripe_charge_id = intent.charges.data[0].id if intent.charges.data else None
                    payment.save()
                    
                    # Update subscription
                    subscription = payment.subscription
                    subscription.plan = plan
                    subscription.status = 'active'
                    subscription.current_period_start = timezone.now()
                    subscription.current_period_end = timezone.now() + timedelta(days=30)
                    subscription.save()
                    
                    # Create invoice
                    invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
                    invoice = Invoice.objects.create(
                        user=request.user,
                        payment=payment,
                        invoice_number=invoice_number,
                        amount_due=payment.amount,
                        amount_paid=payment.amount,
                        currency=payment.currency,
                        status='paid',
                        description=payment.description,
                        paid_at=timezone.now()
                    )
                    
                    # Create invoice item
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        description=f'{plan.capitalize()} Plan - Monthly Subscription',
                        quantity=1,
                        unit_amount=payment.amount,
                        amount=payment.amount
                    )
                    
                    return Response({
                        'success': True,
                        'message': 'Payment successful',
                        'invoice': InvoiceSerializer(invoice).data
                    })
                else:
                    payment.status = 'failed'
                    payment.save()
                    return Response({'error': 'Payment not successful'}, status=status.HTTP_400_BAD_REQUEST)
                    
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MobileMoneyPaymentView(APIView):
    """Process Mobile Money payments (Orange Money, MTN)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            plan = data.get('plan', 'premium')
            phone_number = data.get('phoneNumber')
            network = data.get('network', 'orange')  # 'orange' or 'mtn'
            
            if not phone_number:
                return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Plan pricing
            plan_prices = {
                'premium': 10.00,
                'business': 29.00,
            }
            
            amount = plan_prices.get(plan, 10.00)
            
            # Get or create subscription
            subscription, created = Subscription.objects.get_or_create(
                user=request.user,
                defaults={'plan': 'free'}
            )
            
            # Create payment record
            payment = Payment.objects.create(
                user=request.user,
                subscription=subscription,
                amount=amount,
                currency='USD',
                payment_method='mobile_money',
                mobile_network=network,
                phone_number=phone_number,
                status='pending',
                description=f'{plan.capitalize()} Plan - Mobile Money ({network.capitalize()})'
            )
            
            # In a real implementation, you would integrate with Orange Money/MTN API here
            # For now, we'll simulate a successful payment
            # Orange Money and MTN APIs would be called here to initiate the payment
            
            # Simulate async processing - in production, this would be a webhook callback
            # For demo purposes, we'll mark it as pending and return instructions
            
            return Response({
                'success': True,
                'paymentId': str(payment.id),
                'status': 'pending',
                'message': f'Payment request sent to {phone_number}. Please confirm the payment on your phone.',
                'instructions': f'You will receive a prompt on your {network.capitalize()} Money registered number {phone_number}. Please enter your PIN to authorize the payment of ${amount}.'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyMobilePaymentView(APIView):
    """Verify mobile money payment status"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            payment_id = data.get('paymentId')
            plan = data.get('plan', 'premium')
            
            with transaction.atomic():
                payment = Payment.objects.get(id=payment_id, user=request.user)
                
                # In a real implementation, check with mobile money provider
                # For demo, simulate successful verification
                payment.status = 'completed'
                payment.save()
                
                # Update subscription
                subscription = payment.subscription
                subscription.plan = plan
                subscription.status = 'active'
                subscription.current_period_start = timezone.now()
                subscription.current_period_end = timezone.now() + timedelta(days=30)
                subscription.save()
                
                # Create invoice
                invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
                invoice = Invoice.objects.create(
                    user=request.user,
                    payment=payment,
                    invoice_number=invoice_number,
                    amount_due=payment.amount,
                    amount_paid=payment.amount,
                    currency=payment.currency,
                    status='paid',
                    description=payment.description,
                    paid_at=timezone.now()
                )
                
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=f'{plan.capitalize()} Plan - Monthly Subscription (Mobile Money)',
                    quantity=1,
                    unit_amount=payment.amount,
                    amount=payment.amount
                )
                
                return Response({
                    'success': True,
                    'status': 'completed',
                    'invoice': InvoiceSerializer(invoice).data
                })
                
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InvoiceListView(APIView):
    """Get list of user's invoices"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        invoices = Invoice.objects.filter(user=request.user)
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)


class InvoiceDetailView(APIView):
    """Get invoice details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, invoice_id):
        try:
            invoice = Invoice.objects.get(id=invoice_id, user=request.user)
            serializer = InvoiceSerializer(invoice)
            return Response(serializer.data)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)


class SubscriptionDetailView(APIView):
    """Get current subscription details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)
        except Subscription.DoesNotExist:
            subscription = Subscription.objects.create(user=request.user, plan='free')
        
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    """Handle Stripe webhooks"""
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)
        
        # Handle events
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            self.handle_payment_success(payment_intent)
            
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            self.handle_payment_failure(payment_intent)
            
        elif event['type'] == 'invoice.paid':
            stripe_invoice = event['data']['object']
            self.handle_invoice_paid(stripe_invoice)
            
        return HttpResponse(status=200)
    
    def handle_payment_success(self, payment_intent):
        """Update payment status on successful payment"""
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])
            payment.status = 'completed'
            payment.stripe_charge_id = payment_intent['charges']['data'][0]['id'] if payment_intent.get('charges', {}).get('data') else None
            payment.save()
        except Payment.DoesNotExist:
            pass
    
    def handle_payment_failure(self, payment_intent):
        """Update payment status on failed payment"""
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])
            payment.status = 'failed'
            payment.save()
        except Payment.DoesNotExist:
            pass
    
    def handle_invoice_paid(self, stripe_invoice):
        """Handle Stripe invoice paid event"""
        # Update local invoice if it exists
        try:
            invoice = Invoice.objects.get(stripe_invoice_id=stripe_invoice['id'])
            invoice.status = 'paid'
            invoice.amount_paid = stripe_invoice['amount_paid'] / 100
            invoice.paid_at = timezone.now()
            invoice.save()
        except Invoice.DoesNotExist:
            pass


class CancelSubscriptionView(APIView):
    """Cancel user subscription"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)
            
            if subscription.stripe_subscription_id:
                # Cancel in Stripe
                stripe.Subscription.delete(subscription.stripe_subscription_id)
            
            subscription.status = 'cancelled'
            subscription.save()
            
            return Response({'success': True, 'message': 'Subscription cancelled successfully'})
            
        except Subscription.DoesNotExist:
            return Response({'error': 'No active subscription found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
