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
  // Màu chính được lấy từ HomeBody (nút Explore More)
  static const Color _primaryColor = Color(0xFF40BFFF);
  static const Color _textColor = Color(0xFF222222); // Màu chữ tối hơn cho độ tương phản tốt
  static const Color _lightGreyColor = Color(0xFFE0E0E0); // Màu xám nhạt cho đường phân cách và nền nhẹ

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

  String _getVariantDisplay(dynamic variant) {
    if (variant == null) return '';
    if (variant is String) return variant;
    if (variant is Map) {
      return variant.entries.map((e) => '${e.key}: ${e.value}').join(', ');
    }
    return variant.toString();
  }

  @override
  Widget build(BuildContext context) {
    final items = _cart.items;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Your Cart',
          style: TextStyle(
            color: _textColor,
            fontWeight: FontWeight.bold,
            fontSize: 20, // Tăng kích thước tiêu đề
          ),
        ),
        backgroundColor: const Color.fromARGB(255, 255, 255, 255), // Nền AppBar trắng
        elevation: 0,
        leading: IconButton( // Thay nút menu bằng nút back
          icon: const Icon(Icons.arrow_back_ios, color: _textColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
        iconTheme: const IconThemeData(color: _textColor),
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
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0), // Tăng khoảng cách dưới header
                    child: Row(
                      children: const [
                        Expanded(
                          flex: 5,
                          child: Text(
                            'PRODUCT',
                            style: TextStyle(
                              fontWeight: FontWeight.bold, // Đậm hơn
                              fontSize: 13,
                              color: Colors.grey, // Màu xám cho header
                              letterSpacing: 0.8, // Khoảng cách chữ
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            'PRICE',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Colors.grey,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        SizedBox(width: 16), // Tăng khoảng cách giữa các cột
                        Expanded(
                          flex: 2,
                          child: Text(
                            'QTY',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Colors.grey,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          flex: 2,
                          child: Text(
                            'TOTAL', // Đổi thành TOTAL cho rõ ràng
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Colors.grey,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: _lightGreyColor), // Đường phân cách mỏng hơn, màu nhạt hơn
                  const SizedBox(height: 20), // Khoảng cách sau divider

                  // --- Cart Items ---
                  if (items.isEmpty)
                    Expanded(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.shopping_cart_outlined, size: 90, color: Colors.grey), // Icon lớn hơn
                            SizedBox(height: 16), // Khoảng cách lớn hơn
                            Text(
                              'Your cart is empty',
                              style: TextStyle(
                                fontSize: 18, // Font lớn hơn
                                color: Colors.grey,
                                fontWeight: FontWeight.w600, // Đậm hơn một chút
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Start shopping to add items!',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.separated(
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12.0), // Khoảng cách giữa các sản phẩm
                          child: Divider(height: 1, color: _lightGreyColor),
                        ),
                        itemBuilder: (context, index) {
                          final CartItem itm = items[index];
                          final variantDisplay = _getVariantDisplay(itm.variant);

                          return Card( // Bọc mỗi item trong Card để bo góc
                            elevation: 0, // Không có đổ bóng để giữ thiết kế phẳng
                            margin: EdgeInsets.zero,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12), // Bo góc cho từng sản phẩm
                              side: BorderSide(color: _lightGreyColor.withOpacity(0.6), width: 1), // Thêm border nhẹ
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 12.0), // Padding bên trong card
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // product thumbnail + title
                                  Expanded(
                                    flex: 5,
                                    child: Row(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(8), // Bo góc cho ảnh sản phẩm
                                          child: Image.network(
                                            itm.product.displayImage,
                                            width: 80, // Kích thước ảnh
                                            height: 80,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => Container(
                                              width: 80,
                                              height: 80,
                                              color: Colors.grey.shade100,
                                              child: const Icon(Icons.broken_image, color: Colors.grey),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16), // Khoảng cách giữa ảnh và text
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                itm.product.name,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700, // Đậm hơn
                                                  fontSize: 16, // Font lớn hơn
                                                  color: _textColor,
                                                ),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              if (variantDisplay.isNotEmpty)
                                                Padding(
                                                  padding: const EdgeInsets.only(top: 4.0),
                                                  child: Text(
                                                    variantDisplay,
                                                    style: TextStyle(
                                                      color: Colors.grey[600], // Màu xám đậm hơn
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                ),
                                              const SizedBox(height: 8),
                                              Text(
                                                '\$${itm.product.price.toStringAsFixed(2)}',
                                                style: const TextStyle(
                                                  color: _primaryColor, // Giá tiền màu chính
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        IconButton(
                                          onPressed: () async {
                                            await _cart.remove(itm.product, variant: itm.variant);
                                          },
                                          icon: const Icon(Icons.close, color: Colors.redAccent, size: 20), // Icon nhỏ hơn
                                          splashRadius: 20, // Giảm vùng splash
                                        ),
                                      ],
                                    ),
                                  ),

                                  // price column (đã ẩn vì đã hiển thị trong chi tiết sản phẩm và tổng cộng)
                                  // Expanded(flex: 2, child: Text('\$${itm.product.price.toStringAsFixed(2)}', textAlign: TextAlign.center)),

                                  // const SizedBox(width: 16),

                                  // quantity selector
                                  Expanded(
                                    flex: 2,
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        _buildQuantityButton(
                                          icon: Icons.remove,
                                          onPressed: () => _cart.updateQuantity(itm.product, itm.quantity - 1, variant: itm.variant),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 10.0), // Khoảng cách số lượng
                                          child: Text(
                                            '${itm.quantity}',
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: _textColor,
                                            ),
                                          ),
                                        ),
                                        _buildQuantityButton(
                                          icon: Icons.add,
                                          onPressed: () => _cart.updateQuantity(itm.product, itm.quantity + 1, variant: itm.variant),
                                        ),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(width: 16),

                                  // unit price (total for item)
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      '\$${itm.total.toStringAsFixed(2)}',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800, // Rất đậm
                                        fontSize: 16, // Lớn hơn
                                        color: _textColor,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 32), // Khoảng cách lớn hơn trước footer

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
                            const Text(
                              'APPLY VOUCHER',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: _textColor,
                              ),
                            ),
                            const SizedBox(height: 12), // Khoảng cách lớn hơn
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    decoration: InputDecoration(
                                      hintText: 'Enter voucher code', // Hint text rõ ràng hơn
                                      hintStyle: TextStyle(color: Colors.grey[400]),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14), // Padding input
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10), // Bo góc input
                                        borderSide: BorderSide(color: _lightGreyColor.withOpacity(0.8)),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: BorderSide(color: _lightGreyColor.withOpacity(0.8)),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                        borderSide: const BorderSide(color: _primaryColor, width: 2), // Focus màu chính
                                      ),
                                    ),
                                    style: const TextStyle(fontSize: 15, color: _textColor),
                                  ),
                                ),
                                const SizedBox(width: 16), // Khoảng cách giữa input và button
                                ElevatedButton(
                                  onPressed: () {},
                                  child: const Text(
                                    'Apply', // Đổi text thành Apply
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _primaryColor,
                                    elevation: 2,
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10), // Bo góc button
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 32), // Khoảng cách giữa Voucher và Summary

                      // summary + checkout
                      Expanded(
                        flex: 4,
                        child: Card(
                          elevation: 4, // Thêm elevation cho card summary
                          shadowColor: _primaryColor.withOpacity(0.1), // Màu đổ bóng nhẹ
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16), // Bo góc lớn hơn cho summary card
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(20.0), // Padding lớn hơn
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildSummaryRow('Subtotal', '\$${_cart.subTotal.toStringAsFixed(2)}'),
                                const SizedBox(height: 12),
                                _buildSummaryRow('Shipping fee', '\$20.00'), // Thêm .00 cho đồng bộ
                                const SizedBox(height: 12),
                                _buildSummaryRow('Coupon', 'No'),
                                const Divider(height: 32, thickness: 1, color: _lightGreyColor), // Divider dày và cách đều hơn
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'TOTAL',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800, // Rất đậm
                                        fontSize: 20, // Kích thước lớn
                                        color: _textColor,
                                      ),
                                    ),
                                    Text(
                                      '\$${(_cart.subTotal + 20).toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w900, // Cực đậm
                                        fontSize: 24, // Rất lớn
                                        color: _primaryColor, // Màu tổng tiền là màu chính
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20), // Khoảng cách trước button checkout
                                // Nút Checkout - chuyển sang trang Payment
                                ElevatedButton(
                                  onPressed: _cart.items.isNotEmpty ? _handleCheckout : null,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _primaryColor,
                                    padding: const EdgeInsets.symmetric(vertical: 18), // Nút dày hơn
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12), // Bo góc button
                                    ),
                                    elevation: 4, // Thêm đổ bóng
                                  ),
                                  child: const Text(
                                    'PROCEED TO CHECKOUT',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
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

  // Helper widget cho các nút tăng/giảm số lượng
  Widget _buildQuantityButton({required IconData icon, required VoidCallback onPressed}) {
    return InkWell( // Sử dụng InkWell để có hiệu ứng splash nhẹ nhàng hơn OutlineButton
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8), // Bo góc cho vùng chạm
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: _lightGreyColor), // Border nhẹ
          color: Colors.white, // Nền trắng
        ),
        child: Icon(icon, color: _primaryColor, size: 20), // Icon màu chính
      ),
    );
  }

  // Helper widget cho các dòng trong phần tóm tắt
  Widget _buildSummaryRow(String title, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 15,
            color: Colors.grey[700],
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            color: _textColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}