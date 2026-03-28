import 'package:flutter/material.dart';
import '../../services/cart_service.dart';
import '../../models/cart_item.dart';
import '../payment/payment_screen.dart'; 

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  // 👇 Đã thay thế toàn bộ bằng bộ màu KZONE Central
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneBeige = Color(0xFFFAF7F2);
  static const Color _textColor = Color(0xFF222222); 
  static const Color _lightGreyColor = Color(0xFFE0E0E0); 

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

  void _onCartChanged() {
    if (mounted) setState(() {});
  }

  void _handleCheckout() {
    if (_cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Giỏ hàng của bạn đang trống!'),
          backgroundColor: kzoneBrown,
        ),
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

  // 👇 Hàm định dạng tiền VNĐ chuẩn
  String _formatCurrency(double price) {
    String priceStr = price.toStringAsFixed(0);
    priceStr = priceStr.replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.');
    return '$priceStr₫';
  }

  @override
  Widget build(BuildContext context) {
    final items = _cart.items;
    // Phí vận chuyển mặc định 30k VNĐ thay vì $20
    const double shippingFee = 30000; 

    return Scaffold(
      backgroundColor: kzoneBeige, // Nền Beige sang trọng
      appBar: AppBar(
        title: const Text(
          'Giỏ Hàng', // Việt hóa
          style: TextStyle(
            color: kzoneBrown, // Chữ màu Nâu
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: 0.5,
          ),
        ),
        backgroundColor: Colors.white, 
        elevation: 0.5,
        shadowColor: kzoneBrown.withValues(alpha: 0.1),
        leading: IconButton( 
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: kzoneBrown, size: 22),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // --- Table Headers ---
                  const Padding(
                    padding: EdgeInsets.only(bottom: 12.0), 
                    child: Row(
                      children: [
                        Expanded(
                          flex: 5,
                          child: Text(
                            'SẢN PHẨM',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: Colors.grey, 
                              letterSpacing: 0.8, 
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            'ĐƠN GIÁ',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: Colors.grey,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        SizedBox(width: 8), 
                        Expanded(
                          flex: 2,
                          child: Text(
                            'SL',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: Colors.grey,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          flex: 2,
                          child: Text(
                            'TỔNG', 
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: Colors.grey,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: _lightGreyColor), 
                  const SizedBox(height: 16), 

                  // --- Cart Items ---
                  if (items.isEmpty)
                    Expanded(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.shopping_bag_outlined, size: 80, color: kzoneBrown.withValues(alpha: 0.4)), 
                            const SizedBox(height: 16), 
                            const Text(
                              'Giỏ hàng trống',
                              style: TextStyle(
                                fontSize: 18, 
                                color: kzoneBrown,
                                fontWeight: FontWeight.bold, 
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Hãy khám phá thêm các bộ sưu tập nhé!',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.separated(
                        physics: const BouncingScrollPhysics(),
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final CartItem itm = items[index];
                          final variantDisplay = _getVariantDisplay(itm.variant);

                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: kzoneBrown.withValues(alpha: 0.04),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                )
                              ]
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 12.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // product thumbnail + title
                                  Expanded(
                                    flex: 5,
                                    child: Row(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(10), 
                                          child: Image.network(
                                            itm.product.displayImage,
                                            width: 60, // Thu nhỏ ảnh xíu để chữ trên mobile không bị ép
                                            height: 60,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => Container(
                                              width: 60,
                                              height: 60,
                                              color: kzoneBeige,
                                              child: const Icon(Icons.shopping_bag, color: kzoneBrown),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12), 
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                itm.product.name,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700, 
                                                  fontSize: 14, 
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
                                                      color: Colors.grey[500], 
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ),
                                              // 👇 Nút xóa nằm ngay dưới tên sp cho dễ bấm
                                              InkWell(
                                                onTap: () async {
                                                  await _cart.remove(itm.product, variant: itm.variant);
                                                },
                                                child: const Padding(
                                                  padding: EdgeInsets.only(top: 4.0),
                                                  child: Text('Xóa', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
                                                ),
                                              )
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(width: 8),

                                  // unit price
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      _formatCurrency(itm.product.price),
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                        color: _textColor,
                                      ),
                                    ),
                                  ),

                                  const SizedBox(width: 8),

                                  // quantity selector
                                  Expanded(
                                    flex: 2,
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        _buildQuantityButton(
                                          icon: Icons.add,
                                          onPressed: () => _cart.updateQuantity(itm.product, itm.quantity + 1, variant: itm.variant),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(vertical: 4.0), 
                                          child: Text(
                                            '${itm.quantity}',
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: _textColor,
                                            ),
                                          ),
                                        ),
                                        _buildQuantityButton(
                                          icon: Icons.remove,
                                          onPressed: () => _cart.updateQuantity(itm.product, itm.quantity - 1, variant: itm.variant),
                                        ),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(width: 8),

                                  // total for item
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      _formatCurrency(itm.total),
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w900, 
                                        fontSize: 13, 
                                        color: kzoneBrown, // Đổi màu tổng thành màu chủ đạo
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

                  const SizedBox(height: 20), 

                  // --- Footer: Voucher + Summary + Checkout ---
                  // Đổi thành Wrap hoặc Column cho Mobile responsive
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Voucher input
                      const Text(
                        'MÃ GIẢM GIÁ',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: _textColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: 'Nhập mã KZONE...', 
                                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12), 
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10), 
                                  borderSide: BorderSide.none,
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: kzoneBrown, width: 1.5), 
                                ),
                              ),
                              style: const TextStyle(fontSize: 14, color: _textColor),
                            ),
                          ),
                          const SizedBox(width: 12), 
                          ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black87, // Đổi màu nút Apply cho ngầu
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10), 
                              ),
                            ),
                            child: const Text(
                              'Áp dụng', 
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20), 

                      // summary + checkout
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: kzoneBrown.withValues(alpha: 0.08), 
                              blurRadius: 20,
                              offset: const Offset(0, 5),
                            )
                          ]
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(20.0), 
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildSummaryRow('Tạm tính', _formatCurrency(_cart.subTotal)),
                              const SizedBox(height: 12),
                              _buildSummaryRow('Phí giao hàng', _formatCurrency(shippingFee)), 
                              const SizedBox(height: 12),
                              _buildSummaryRow('Khuyến mãi', '- 0₫'),
                              const Divider(height: 32, thickness: 1, color: _lightGreyColor), 
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'TỔNG CỘNG',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900, 
                                      fontSize: 16, 
                                      color: _textColor,
                                    ),
                                  ),
                                  Text(
                                    _cart.items.isEmpty ? '0₫' : _formatCurrency(_cart.subTotal + shippingFee),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900, 
                                      fontSize: 22, 
                                      color: kzoneBrown, 
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20), 
                              // Nút Checkout
                              ElevatedButton(
                                onPressed: _cart.items.isNotEmpty ? _handleCheckout : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: kzoneBrown,
                                  disabledBackgroundColor: Colors.grey.shade300,
                                  padding: const EdgeInsets.symmetric(vertical: 16), 
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12), 
                                  ),
                                  elevation: 2, 
                                ),
                                child: const Text(
                                  'TIẾN HÀNH THANH TOÁN',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
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
    return InkWell( 
      onTap: onPressed,
      borderRadius: BorderRadius.circular(6), 
      child: Container(
        width: 28, // Đã thu nhỏ lại cho phù hợp thiết kế mobile
        height: 28,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(6),
          color: kzoneBeige, 
        ),
        child: Icon(icon, color: kzoneBrown, size: 16), 
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
            fontSize: 14,
            color: Colors.grey[600],
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