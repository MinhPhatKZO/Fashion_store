import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/momo_service.dart';
import '../../services/vnpay_service.dart';
import '../../services/cart_service.dart';

enum PaymentMethod { cod, momo, vnpay }

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({Key? key}) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final CartService _cart = CartService.instance;
  PaymentMethod? _selectedPaymentMethod;
  
  // Controllers cho form thông tin
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  // Thêm dropdown cho ngân hàng VNPAY (optional)
  String? _selectedBankCode;
  final List<Map<String, String>> _vnpayBanks = [
    {'code': '', 'name': 'Cổng thanh toán VNPAYQR'},
    {'code': 'VNPAYQR', 'name': 'Thanh toán qua ứng dụng hỗ trợ VNPAYQR'},
    {'code': 'VNBANK', 'name': 'Thẻ ATM - Tài khoản ngân hàng nội địa'},
    {'code': 'INTCARD', 'name': 'Thẻ thanh toán quốc tế'},
  ];

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handlePayment() async {
    // Kiểm tra xem đã chọn phương thức thanh toán chưa
    if (_selectedPaymentMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn phương thức thanh toán')),
      );
      return;
    }

    // Validate form thông tin
    if (!_formKey.currentState!.validate()) {
      return;
    }

    switch (_selectedPaymentMethod!) {
      case PaymentMethod.cod:
        await _processCODPayment();
        break;
      case PaymentMethod.momo:
        await _processMoMoPayment();
        break;
      case PaymentMethod.vnpay:
        await _processVNPayPayment();
        break;
    }
  }

  Future<void> _processCODPayment() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đặt hàng COD thành công!')),
    );
    // TODO: Gọi API tạo đơn hàng với thông tin:
    // - Địa chỉ: _addressController.text
    // - SĐT: _phoneController.text
    // - Phương thức: COD
    
    // _cart.clear();
    // Navigator.of(context).pushReplacement(...);
  }

  Future<void> _processMoMoPayment() async {
    if (_cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng trống')),
      );
      return;
    }

    final service = MoMoService();
    final amount = (_cart.subTotal + 20).toStringAsFixed(0);
    final orderInfo = "Thanh toán đơn hàng - ${_phoneController.text}";

    final payment = await service.createPayment(
      amount: amount,
      orderInfo: orderInfo,
    );

    if (payment != null && payment.payUrl.isNotEmpty) {
      final url = Uri.parse(payment.payUrl);
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
        // TODO: Lưu thông tin đơn hàng với địa chỉ và SĐT
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không thể mở liên kết MoMo')),
          );
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thanh toán MoMo thất bại')),
        );
      }
    }
  }

  Future<void> _processVNPayPayment() async {
    if (_cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng trống')),
      );
      return;
    }

    // Hiển thị loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      final service = VNPayService();
      final total = _cart.subTotal + 20; // subtotal + shipping
      final amount = total.toStringAsFixed(0); // VNPAY yêu cầu số nguyên
      final orderInfo = "Thanh toan don hang - ${_phoneController.text}";

      print('🔹 VNPAY Payment Request:');
      print('   Amount: $amount VND');
      print('   Order Info: $orderInfo');
      print('   Bank Code: $_selectedBankCode');

      final payment = await service.createPayment(
        amount: amount,
        orderInfo: orderInfo,
        bankCode: _selectedBankCode,
        language: 'vn',
      );

      // Đóng loading dialog
      if (mounted) Navigator.of(context).pop();

      if (payment != null && payment.success && payment.paymentUrl.isNotEmpty) {
        print('✅ VNPAY Payment URL: ${payment.paymentUrl}');
        
        final url = Uri.parse(payment.paymentUrl);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
          
          // TODO: Lưu thông tin đơn hàng vào database
          // Gọi API tạo order với status "pending"
          // Khi VNPAY callback về vnpay_return, cập nhật status thành "paid"
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Đang chuyển đến trang thanh toán VNPAY...'),
                backgroundColor: Colors.blue,
              ),
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Không thể mở liên kết VNPAY')),
            );
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                payment?.message ?? 'Thanh toán VNPAY thất bại',
              ),
            ),
          );
        }
      }
    } catch (e) {
      // Đóng loading nếu có lỗi
      if (mounted) Navigator.of(context).pop();
      
      print('❌ VNPAY Payment Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi kết nối: $e')),
        );
      }
    }
  }

  String _getPaymentMethodName(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cod:
        return 'Thanh toán khi nhận hàng (COD)';
      case PaymentMethod.momo:
        return 'MoMo Wallet';
      case PaymentMethod.vnpay:
        return 'VNPAY';
    }
  }

  Widget _buildPaymentMethodCard(PaymentMethod method) {
    final isSelected = _selectedPaymentMethod == method;
    IconData icon;
    Color color;

    switch (method) {
      case PaymentMethod.cod:
        icon = Icons.money;
        color = Colors.green;
        break;
      case PaymentMethod.momo:
        icon = Icons.account_balance_wallet;
        color = Colors.pink;
        break;
      case PaymentMethod.vnpay:
        icon = Icons.credit_card;
        color = Colors.blue;
        break;
    }

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPaymentMethod = method;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
          color: isSelected ? color.withOpacity(0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                _getPaymentMethodName(method),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: color),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoForm() {
    if (_selectedPaymentMethod == null) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'THÔNG TIN GIAO HÀNG',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                decoration: InputDecoration(
                  labelText: 'Địa chỉ giao hàng *',
                  hintText: 'Nhập địa chỉ của bạn',
                  prefixIcon: const Icon(Icons.location_on),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                maxLines: 2,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Vui lòng nhập địa chỉ';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: InputDecoration(
                  labelText: 'Số điện thoại *',
                  hintText: 'Nhập số điện thoại',
                  prefixIcon: const Icon(Icons.phone),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Vui lòng nhập số điện thoại';
                  }
                  if (value.length < 10) {
                    return 'Số điện thoại không hợp lệ';
                  }
                  return null;
                },
              ),
              
              // ✅ Thêm dropdown chọn ngân hàng cho VNPAY
              if (_selectedPaymentMethod == PaymentMethod.vnpay) ...[
                const SizedBox(height: 16),
                const Text(
                  'Chọn phương thức thanh toán (Tùy chọn)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedBankCode,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.account_balance),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  hint: const Text('Chọn phương thức'),
                  items: _vnpayBanks.map((bank) {
                    return DropdownMenuItem<String>(
                      value: bank['code'],
                      child: Text(
                        bank['name']!,
                        style: const TextStyle(fontSize: 14),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedBankCode = value;
                    });
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final items = _cart.items;
    final subtotal = _cart.subTotal;
    const shippingFee = 20.0;
    final total = subtotal + shippingFee;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left side - Payment methods and info form
                  Expanded(
                    flex: 6,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'CHỌN PHƯƠNG THỨC THANH TOÁN',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildPaymentMethodCard(PaymentMethod.cod),
                        _buildPaymentMethodCard(PaymentMethod.momo),
                        _buildPaymentMethodCard(PaymentMethod.vnpay),
                        const SizedBox(height: 24),
                        _buildInfoForm(),
                      ],
                    ),
                  ),
                  
                  const SizedBox(width: 24),
                  
                  // Right side - Order summary
                  Expanded(
                    flex: 4,
                    child: Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text(
                              'ĐƠN HÀNG CỦA BẠN',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const Divider(height: 24),
                            
                            // Order items
                            ...items.map((item) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: Image.network(
                                      item.product.displayImage,
                                      width: 50,
                                      height: 50,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        width: 50,
                                        height: 50,
                                        color: Colors.grey.shade200,
                                        child: const Icon(Icons.image, size: 20),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.product.name,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w500,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'x${item.quantity}',
                                          style: TextStyle(
                                            color: Colors.grey.shade600,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '\$${item.total.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            )),
                            
                            const Divider(height: 24),
                            
                            // Subtotal
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Tạm tính'),
                                Text('\$${subtotal.toStringAsFixed(2)}'),
                              ],
                            ),
                            const SizedBox(height: 8),
                            
                            // Shipping
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: const [
                                Text('Phí vận chuyển'),
                                Text('\$20.00'),
                              ],
                            ),
                            
                            const Divider(height: 24),
                            
                            // Total
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'TỔNG CỘNG',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  '\$${total.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                                ),
                              ],
                            ),
                            
                            const SizedBox(height: 24),
                            
                            // Payment button
                            ElevatedButton(
                              onPressed: _handlePayment,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: Text(
                                _selectedPaymentMethod == null
                                    ? 'HOÀN TẤT THANH TOÁN'
                                    : _selectedPaymentMethod == PaymentMethod.cod
                                        ? 'ĐẶT HÀNG'
                                        : 'THANH TOÁN NGAY',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
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
            ),
          ),
        ),
      ),
    );
  }
}