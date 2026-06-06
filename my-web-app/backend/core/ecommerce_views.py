from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Sum, Count, F
from datetime import timedelta
import uuid

from core.models import (
    Product,
    ProductCategory,
    ProductOption,
    ProductVariant,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Coupon,
    ProductReview,
    Wishlist,
    Website,
    Payment,
)
from .serializers import (
    ProductCategorySerializer,
    ProductSerializer,
    ProductOptionSerializer,
    ProductVariantSerializer,
    CartSerializer,
    CartItemSerializer,
    CartUpdateSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    OrderItemSerializer,
    CouponApplySerializer,
    ProductReviewSerializer,
    WishlistSerializer,
    CheckoutSerializer,
    OrderTrackingSerializer,
)


# ============================================
# PUBLIC STORE VIEWS (No auth required for browsing)
# ============================================


class PublicProductCategoryListView(generics.ListAPIView):
    """List all product categories for a website (public)"""

    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        website_id = self.kwargs.get("website_id")
        queryset = ProductCategory.objects.filter(is_active=True)
        if website_id:
            queryset = queryset.filter(website_id=website_id)
        return queryset.order_by("name")


class PublicProductListView(generics.ListAPIView):
    """List products for a website (public)"""

    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        website_id = self.kwargs.get("website_id")
        queryset = Product.objects.filter(is_active=True)
        if website_id:
            queryset = queryset.filter(website_id=website_id)

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(
                Q(category__slug=category) | Q(category__name__icontains=category)
            )

        # Search
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(short_description__icontains=search)
            )

        # Sort
        sort = self.request.query_params.get("sort", "newest")
        sort_map = {
            "newest": "-created_at",
            "price_asc": "current_price",
            "price_desc": "-current_price",
            "name": "name",
            "featured": "-is_featured",
        }
        queryset = queryset.order_by(sort_map.get(sort, "-created_at"))

        return queryset


class PublicProductDetailView(generics.RetrieveAPIView):
    """Get product details (public)"""

    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Product.objects.filter(is_active=True)
    lookup_field = "slug"


# ============================================
# CART VIEWS (Authenticated)
# ============================================


class CartView(generics.GenericAPIView):
    """Get or create cart for current user"""

    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(
            user=self.request.user, website_id=self.kwargs.get("website_id"), is_active=True
        )

    def get(self, request, website_id):
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            website_id=website_id,
            is_active=True,
        )
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class CartItemView(generics.GenericAPIView):
    """Add, update, or remove items from cart"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, website_id):
        """Add item to cart"""
        product_id = request.data.get("product_id")
        variant_id = request.data.get("variant_id")
        quantity = request.data.get("quantity", 1)

        if not product_id:
            return Response(
                {"error": "product_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check product belongs to website
        if product.website_id != website_id:
            return Response(
                {"error": "Product does not belong to this website"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check inventory
        if product.track_inventory and product.quantity < quantity:
            return Response(
                {"error": "Insufficient stock"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create active cart
        cart, created = Cart.objects.get_or_create(
            user=request.user, website_id=website_id, is_active=True
        )

        # Check if variant exists and belongs to product
        variant = None
        if variant_id:
            try:
                variant = ProductVariant.objects.get(id=variant_id, product=product)
            except ProductVariant.DoesNotExist:
                return Response(
                    {"error": "Variant not found"}, status=status.HTTP_404_NOT_FOUND
                )

        # Check for existing cart item with same product and variant
        existing_item = CartItem.objects.filter(
            cart=cart, product=product, variant=variant
        ).first()

        if existing_item:
            existing_item.quantity += quantity
            existing_item.save()
            cart_item = existing_item
        else:
            cart_item = CartItem.objects.create(
                cart=cart,
                product=product,
                variant=variant,
                quantity=quantity,
            )

        return Response(
            {"message": "Item added to cart", "cart_item": CartItemSerializer(cart_item).data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, website_id):
        """Update cart item quantity"""
        cart_item_id = request.data.get("cart_item_id")
        quantity = request.data.get("quantity")

        if not cart_item_id or quantity is None:
            return Response(
                {"error": "cart_item_id and quantity are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cart = Cart.objects.get(
                user=request.user, website_id=website_id, is_active=True
            )
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response(
                {"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if quantity <= 0:
            cart_item.delete()
            return Response({"message": "Item removed from cart"})

        # Check inventory
        product = cart_item.product
        if product.track_inventory and product.quantity < quantity:
            return Response(
                {"error": "Insufficient stock"}, status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()

        return Response(
            {"message": "Cart updated", "cart_item": CartItemSerializer(cart_item).data}
        )

    def delete(self, request, website_id):
        """Remove item from cart"""
        cart_item_id = request.data.get("cart_item_id")

        if not cart_item_id:
            return Response(
                {"error": "cart_item_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cart = Cart.objects.get(
                user=request.user, website_id=website_id, is_active=True
            )
            cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
            cart_item.delete()
            return Response({"message": "Item removed from cart"})
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response(
                {"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND
            )


class CartClearView(generics.GenericAPIView):
    """Clear all items from cart"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, website_id):
        try:
            cart = Cart.objects.get(
                user=request.user, website_id=website_id, is_active=True
            )
            cart.items.all().delete()
            return Response({"message": "Cart cleared"})
        except Cart.DoesNotExist:
            return Response({"message": "Cart is already empty"})


# ============================================
# COUPON VIEWS (Authenticated)
# ============================================


class CouponValidateView(generics.GenericAPIView):
    """Validate a coupon code for a website's cart"""

    serializer_class = CouponApplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, website_id):
        code = request.data.get("code")

        if not code:
            return Response(
                {"error": "Coupon code is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            website = Website.objects.get(id=website_id)
        except Website.DoesNotExist:
            return Response(
                {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
            )

        coupon = Coupon.objects.filter(
            code__iexact=code, website=website, is_active=True
        ).first()

        if not coupon:
            return Response(
                {"error": "Invalid coupon code"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not coupon.is_valid:
            return Response(
                {"error": "Coupon is expired or usage limit reached"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check minimum amount
        try:
            cart = Cart.objects.get(user=request.user, website=website, is_active=True)
            cart_subtotal = cart.subtotal
        except Cart.DoesNotExist:
            cart_subtotal = 0

        if coupon.minimum_amount and cart_subtotal < coupon.minimum_amount:
            return Response(
                {
                    "error": f"Minimum order amount of ${coupon.minimum_amount} required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate discount
        if coupon.discount_type == "percentage":
            discount = cart_subtotal * (coupon.discount_value / 100)
        elif coupon.discount_type == "fixed":
            discount = coupon.discount_value
        elif coupon.discount_type == "shipping":
            discount = 0  # Free shipping applied at checkout
        else:
            discount = 0

        if coupon.maximum_discount and discount > coupon.maximum_discount:
            discount = coupon.maximum_discount

        return Response(
            {
                "valid": True,
                "coupon": {
                    "code": coupon.code,
                    "discount_type": coupon.discount_type,
                    "discount_value": float(coupon.discount_value),
                    "discount_amount": float(discount),
                    "description": coupon.description,
                },
            }
        )


# ============================================
# CHECKOUT VIEW (Authenticated)
# ============================================


class CheckoutView(generics.GenericAPIView):
    """Process checkout from cart"""

    serializer_class = CheckoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, website_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get cart
        try:
            cart = Cart.objects.get(
                user=request.user, website_id=website_id, is_active=True
            )
        except Cart.DoesNotExist:
            return Response(
                {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not cart.items.exists():
            return Response(
                {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get website
        try:
            website = Website.objects.get(id=website_id)
        except Website.DoesNotExist:
            return Response(
                {"error": "Website not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Validate and apply coupon if provided
        coupon = None
        discount_amount = 0
        coupon_code = serializer.validated_data.get("coupon_code")
        shipping_cost = serializer.validated_data.get("shipping_cost", 0)

        if coupon_code:
            coupon = Coupon.objects.filter(
                code__iexact=coupon_code, website=website, is_active=True
            ).first()

            if coupon and coupon.is_valid:
                cart_subtotal = cart.subtotal
                if coupon.minimum_amount and cart_subtotal < coupon.minimum_amount:
                    return Response(
                        {
                            "error": f"Minimum order amount of ${coupon.minimum_amount} required for this coupon"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if coupon.discount_type == "percentage":
                    discount_amount = cart.subtotal * (coupon.discount_value / 100)
                elif coupon.discount_type == "fixed":
                    discount_amount = coupon.discount_value

                if coupon.maximum_discount and discount_amount > coupon.maximum_discount:
                    discount_amount = coupon.maximum_discount

                # Increment usage
                coupon.used_count += 1
                coupon.save()

        # Build order items and calculate totals
        order_items = []
        subtotal = 0

        for cart_item in cart.items.select_related("product", "variant").all():
            unit_price = (
                cart_item.variant.current_price
                if cart_item.variant
                else cart_item.product.current_price
            )
            item_total = unit_price * cart_item.quantity
            subtotal += item_total

            order_item = OrderItem(
                product=cart_item.product,
                variant=cart_item.variant,
                product_name=cart_item.product.name,
                variant_name=str(cart_item.variant.options) if cart_item.variant else None,
                unit_price=unit_price,
                quantity=cart_item.quantity,
                total_price=item_total,
            )
            order_items.append(order_item)

        # Calculate tax (simplified: 8% of subtotal)
        tax_rate = 0.08
        tax_amount = round(subtotal * tax_rate, 2)

        total = subtotal + tax_amount + shipping_cost - discount_amount

        # Create order
        order_number = f"ORD-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        shipping_name = serializer.validated_data.get("shipping_name", "")
        shipping_address_line1 = serializer.validated_data.get("shipping_address_line1", "")
        shipping_address_line2 = serializer.validated_data.get("shipping_address_line2", "")
        shipping_city = serializer.validated_data.get("shipping_city", "")
        shipping_state = serializer.validated_data.get("shipping_state", "")
        shipping_country = serializer.validated_data.get("shipping_country", "")
        shipping_postal_code = serializer.validated_data.get("shipping_postal_code", "")

        same_as_shipping = serializer.validated_data.get("same_as_shipping", True)

        order = Order.objects.create(
            order_number=order_number,
            website=website,
            user=request.user,
            email=serializer.validated_data.get("email", request.user.email),
            phone=serializer.validated_data.get("phone", ""),
            shipping_name=shipping_name,
            shipping_address_line1=shipping_address_line1,
            shipping_address_line2=shipping_address_line2,
            shipping_city=shipping_city,
            shipping_state=shipping_state,
            shipping_country=shipping_country,
            shipping_postal_code=shipping_postal_code,
            billing_name=shipping_name if same_as_shipping else serializer.validated_data.get("billing_name", ""),
            billing_address_line1=shipping_address_line1 if same_as_shipping else serializer.validated_data.get("billing_address_line1", ""),
            billing_address_line2=shipping_address_line2 if same_as_shipping else serializer.validated_data.get("billing_address_line2", ""),
            billing_city=shipping_city if same_as_shipping else serializer.validated_data.get("billing_city", ""),
            billing_state=shipping_state if same_as_shipping else serializer.validated_data.get("billing_state", ""),
            billing_country=shipping_country if same_as_shipping else serializer.validated_data.get("billing_country", ""),
            billing_postal_code=shipping_postal_code if same_as_shipping else serializer.validated_data.get("billing_postal_code", ""),
            same_as_shipping=same_as_shipping,
            items=order_items,
            subtotal=subtotal,
            tax_amount=tax_amount,
            shipping_cost=shipping_cost,
            discount_amount=discount_amount,
            total=total,
            coupon=coupon,
            payment_method=serializer.validated_data.get("payment_method", "stripe"),
            notes=serializer.validated_data.get("notes", ""),
        )

        # Create OrderItem records
        for item in order_items:
            item.order = order
            item.save()

        # Clear cart
        cart.items.all().delete()

        # Handle payment
        payment_method = serializer.validated_data.get("payment_method", "stripe")

        if payment_method == "stripe":
            # Create Stripe payment intent or redirect to payment
            return Response(
                {
                    "success": True,
                    "order": OrderSerializer(order).data,
                    "payment_method": "stripe",
                    "message": "Order created. Proceed to payment.",
                    "payment_intent_needed": True,
                    "order_id": str(order.id),
                },
                status=status.HTTP_201_CREATED,
            )
        elif payment_method == "flutterwave":
            return Response(
                {
                    "success": True,
                    "order": OrderSerializer(order).data,
                    "payment_method": "flutterwave",
                    "message": "Order created. Proceed to Flutterwave payment.",
                    "payment_intent_needed": True,
                    "order_id": str(order.id),
                },
                status=status.HTTP_201_CREATED,
            )
        elif payment_method == "mobile_money":
            return Response(
                {
                    "success": True,
                    "order": OrderSerializer(order).data,
                    "payment_method": "mobile_money",
                    "message": "Order created. Proceed to Mobile Money payment.",
                    "payment_intent_needed": True,
                    "order_id": str(order.id),
                },
                status=status.HTTP_201_CREATED,
            )
        elif payment_method == "paypal":
            return Response(
                {
                    "success": True,
                    "order": OrderSerializer(order).data,
                    "payment_method": "paypal",
                    "message": "Order created. Redirect to PayPal.",
                    "payment_intent_needed": True,
                    "order_id": str(order.id),
                },
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                {
                    "success": True,
                    "order": OrderSerializer(order).data,
                    "message": "Order created successfully.",
                },
                status=status.HTTP_201_CREATED,
            )


# ============================================
# ORDER TRACKING VIEWS (Authenticated)
# ============================================


class OrderListView(generics.ListAPIView):
    """List all orders for current user"""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")


class OrderDetailView(generics.RetrieveAPIView):
    """Get order details"""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderTrackingView(generics.GenericAPIView):
    """Track order by order number (can be used by authenticated users)"""

    serializer_class = OrderTrackingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        order_number = request.query_params.get("order_number")

        if not order_number:
            return Response(
                {"error": "order_number is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(
                order_number=order_number, user=request.user
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(OrderTrackingSerializer(order).data)


# ============================================
# WISHLIST VIEWS (Authenticated)
# ============================================


class WishlistView(generics.GenericAPIView):
    """Manage user's wishlist"""

    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, website_id):
        wishlist, created = Wishlist.objects.get_or_create(
            user=request.user, website_id=website_id
        )
        serializer = WishlistSerializer(wishlist)
        return Response(serializer.data)

    def post(self, request, website_id):
        """Add product to wishlist"""
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
            )

        wishlist, created = Wishlist.objects.get_or_create(
            user=request.user, website_id=website_id
        )
        wishlist.products.add(product)

        return Response(
            {"message": "Product added to wishlist"},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, website_id):
        """Remove product from wishlist"""
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            wishlist = Wishlist.objects.get(user=request.user, website_id=website_id)
            wishlist.products.remove(product_id)
            return Response({"message": "Product removed from wishlist"})
        except Wishlist.DoesNotExist:
            return Response({"error": "Wishlist not found"}, status=status.HTTP_404_NOT_FOUND)


# ============================================
# PRODUCT REVIEW VIEWS (Authenticated)
# ============================================


class ProductReviewView(generics.GenericAPIView):
    """Submit a review for a product"""

    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, product_id):
        product = generics.get_object_or_404(Product, id=product_id)

        # Check if user has purchased this product (via order items)
        has_purchased = OrderItem.objects.filter(
            order__user=request.user,
            product=product,
            order__payment_status="paid",
        ).exists()

        serializer = ProductReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = ProductReview.objects.create(
            product=product,
            user=request.user,
            rating=serializer.validated_data["rating"],
            title=serializer.validated_data.get("title", ""),
            comment=serializer.validated_data.get("comment", ""),
            is_verified_purchase=has_purchased,
        )

        return Response(
            ProductReviewSerializer(review).data, status=status.HTTP_201_CREATED
        )


# ============================================
# STOREFRONT / PUBLIC WEBSITE E-COMMERCE VIEWS
# ============================================


class PublicStorefrontView(generics.GenericAPIView):
    """Get full store data for a published website (public)"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, website_id):
        try:
            website = Website.objects.get(id=website_id, is_published=True)
        except Website.DoesNotExist:
            return Response(
                {"error": "Store not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get categories with product counts
        categories = ProductCategory.objects.filter(
            website=website, is_active=True
        ).annotate(product_count=Count("products"))

        # Get featured products
        featured_products = Product.objects.filter(
            website=website, is_active=True, is_featured=True
        )[:8]

        # Get all active products count
        total_products = Product.objects.filter(
            website=website, is_active=True
        ).count()

        return Response(
            {
                "website": {
                    "id": website.id,
                    "name": website.name,
                    "slug": website.slug,
                    "custom_domain": website.custom_domain,
                    "subdomain": website.subdomain,
                    "seo_title": website.seo_title,
                    "seo_description": website.seo_description,
                },
                "categories": ProductCategorySerializer(categories, many=True).data,
                "featured_products": ProductSerializer(featured_products, many=True).data,
                "total_products": total_products,
            }
        )


class StoreProductsView(generics.ListAPIView):
    """List all products for a public store"""

    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        website_id = self.kwargs.get("website_id")
        queryset = Product.objects.filter(
            website_id=website_id, is_active=True
        )

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(
                Q(category__slug=category) | Q(category__name__icontains=category)
            )

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(short_description__icontains=search)
            )

        sort = self.request.query_params.get("sort", "newest")
        sort_map = {
            "newest": "-created_at",
            "price_asc": "current_price",
            "price_desc": "-current_price",
            "name": "name",
            "featured": "-is_featured",
        }
        return queryset.order_by(sort_map.get(sort, "-created_at"))