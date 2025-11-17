import 'package:flutter/material.dart';
import '../../services/cart_service.dart';
import '../../models/cart_item.dart';
import '../payment/payment_screen.dart'; // Import trang payment

class CartScreen extends StatefulWidget {
  const CartScreen({Key? key}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService _cart = CartService.instance;

  @override
  void initState() {
    super.initState();
    _cart.load();
    _cart.addListener(_onCartChanged);
  }

  @override
  void dispose() {
    _cart.removeListener(_onCartChanged);
    super.dispose();
  }

  void _onCartChanged() => setState(() {});

  // Phương thức checkout chuyển sang trang Payment
  void _handleCheckout() {
    if (_cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng trống')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const PaymentScreen()),
    );
  }

  // Helper để hiển thị variant
  String _getVariantDisplay(dynamic variant) {
    if (variant == null) return '';
    if (variant is String) return variant;
    if (variant is Map) {
      // Nếu variant là Map, format nó thành string
      return variant.entries.map((e) => '${e.key}: ${e.value}').join(', ');
    }
    return variant.toString();
  }

  @override
  Widget build(BuildContext context) {
    final items = _cart.items;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cart'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // --- Table Headers ---
                  Row(
                    children: const [
                      Expanded(flex: 5, child: Text('PRODUCT', style: TextStyle(fontWeight: FontWeight.w700))),
                      Expanded(flex: 2, child: Text('PRICE', style: TextStyle(fontWeight: FontWeight.w700))),
                      SizedBox(width: 12),
                      Expanded(flex: 2, child: Text('QTY', style: TextStyle(fontWeight: FontWeight.w700))),
                      SizedBox(width: 12),
                      Expanded(flex: 2, child: Text('UNIT PRICE', style: TextStyle(fontWeight: FontWeight.w700))),
                    ],
                  ),
                  const Divider(height: 28),

                  // --- Cart Items ---
                  if (items.isEmpty)
                    Expanded(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('Your cart is empty', style: TextStyle(fontSize: 16, color: Colors.grey)),
                          ],
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.separated(
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const Divider(),
                        itemBuilder: (context, index) {
                          final CartItem itm = items[index];
                          final variantDisplay = _getVariantDisplay(itm.variant);
                          
                          return SizedBox(
                            height: 120,
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                // product thumbnail + title
                                Expanded(
                                  flex: 5,
                                  child: Row(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(6),
                                        child: Image.network(
                                          itm.product.displayImage,
                                          width: 84,
                                          height: 84,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => Container(
                                            width: 84,
                                            height: 84,
                                            color: Colors.grey.shade100,
                                            child: const Icon(Icons.broken_image, color: Colors.grey),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(itm.product.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                            if (variantDisplay.isNotEmpty)
                                              Text(variantDisplay, style: const TextStyle(color: Colors.black54, fontSize: 12)),
                                            const SizedBox(height: 6),
                                            Text('\$${itm.product.price.toStringAsFixed(2)}', style: const TextStyle(color: Colors.grey)),
                                          ],
                                        ),
                                      ),
                                      IconButton(
                                        onPressed: () async {
                                          await _cart.remove(itm.product, variant: itm.variant);
                                        },
                                        icon: const Icon(Icons.close, color: Colors.redAccent),
                                      ),
                                    ],
                                  ),
                                ),

                                // price column
                                Expanded(flex: 2, child: Text('\$${itm.product.price.toStringAsFixed(2)}', textAlign: TextAlign.center)),

                                const SizedBox(width: 12),

                                // quantity selector
                                Expanded(
                                  flex: 2,
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      OutlinedButton(
                                        onPressed: () => _cart.updateQuantity(itm.product, itm.quantity - 1, variant: itm.variant),
                                        child: const Text('-'),
                                        style: OutlinedButton.styleFrom(minimumSize: const Size(36, 32)),
                                      ),
                                      const SizedBox(width: 8),
                                      Text('${itm.quantity}'),
                                      const SizedBox(width: 8),
                                      OutlinedButton(
                                        onPressed: () => _cart.updateQuantity(itm.product, itm.quantity + 1, variant: itm.variant),
                                        child: const Text('+'),
                                        style: OutlinedButton.styleFrom(minimumSize: const Size(36, 32)),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(width: 12),

                                // unit price
                                Expanded(
                                  flex: 2,
                                  child: Text('\$${itm.total.toStringAsFixed(2)}', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 18),

                  // --- Footer: Voucher + Summary + Checkout ---
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Voucher input
                      Expanded(
                        flex: 6,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('APPLY VOUCHER', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    decoration: InputDecoration(
                                      hintText: 'Voucher code',
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton(onPressed: () {}, child: const Text('Redeem')),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 24),

                      // summary + checkout
                      Expanded(
                        flex: 4,
                        child: Card(
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Subtotal'),
                                    Text('\$${_cart.subTotal.toStringAsFixed(2)}'),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: const [
                                    Text('Shipping fee'),
                                    Text('\$20'),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: const [Text('Coupon'), Text('No')],
                                ),
                                const Divider(height: 20),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('TOTAL', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                                    Text('\$${(_cart.subTotal + 20).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                // Nút Checkout - chuyển sang trang Payment
                                ElevatedButton(
                                  onPressed: _cart.items.isNotEmpty ? _handleCheckout : null,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                  ),
                                  child: const Text('PROCEED TO CHECKOUT'),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}