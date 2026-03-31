import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
import json

stripe.api_key = settings.STRIPE_SECRET_KEY

@method_decorator(csrf_exempt, name='dispatch')
class StripeCheckoutSessionView(View):
    def post(self, request):
        data = json.loads(request.body)
        plan = data.get('plan', 'pro')
        price_lookup = {
            'pro': settings.STRIPE_PRO_PRICE_ID,
            'business': settings.STRIPE_BUSINESS_PRICE_ID,
        }
        price_id = price_lookup.get(plan, settings.STRIPE_PRO_PRICE_ID)
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='payment',
                success_url=settings.STRIPE_SUCCESS_URL,
                cancel_url=settings.STRIPE_CANCEL_URL,
            )
            return JsonResponse({'id': session.id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
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
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            # TODO: fulfill the purchase, e.g., upgrade user plan
        return HttpResponse(status=200)
