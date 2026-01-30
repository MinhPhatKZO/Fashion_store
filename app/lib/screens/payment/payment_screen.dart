import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/momo_service.dart';
import '../../services/vnpay_service.dart';
import '../../services/cart_service.dart';

enum PaymentMethod { cod, momo, vnpay }

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final CartService _cart = CartService.instance;
  PaymentMethod? _selectedPaymentMethod;

  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isProcessing = false;

  // Dropdown ngân hàng VNPAY (optional)
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
    if (_selectedPaymentMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn phương thức thanh toán')),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final orderId = DateTime.now().millisecondsSinceEpoch.toString();
    final totalAmount = _cart.subTotal + 20; // subtotal + shipping

    switch (_selectedPaymentMethod!) {
      case PaymentMethod.cod:
        await _processCOD(orderId, totalAmount);
        break;
      case PaymentMethod.momo:
        await _processMoMo(orderId, totalAmount);
        break;
      case PaymentMethod.vnpay:
        await _processVNPay(orderId, totalAmount);
        break;
    }
  }

  Future<void> _processCOD(String orderId, double amount) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đặt hàng COD thành công!')),
    );
    await _cart.clear();
    // TODO: Gọi API lưu order với phương thức COD
  }

  Future<void> _processMoMo(String orderId, double amount) async {
    if (_cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng trống')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    try {
      final service = MoMoService();
      final payment = await service.createPayment(orderId, amount); // lấy payment url từ MoMo

      if (payment != null && payment.payUrl.isNotEmpty) {
        final url = Uri.parse(payment.payUrl);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không thể mở liên kết MoMo')),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(payment?.message ?? 'Thanh toán MoMo thất bại')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối MoMo: $e')),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  Future<void> _processVNPay(String orderId, double amount) async {
    if (_cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng trống')),
      );
      return;
    }

    setState(() => _isProcessing = true);
    try {
      final service = VNPayService();
      final payment = await service.createPayment(orderId, amount); // lấy payment url từ VNPAY

      if (payment != null && payment.success && payment.paymentUrl.isNotEmpty) {
        final url = Uri.parse(payment.paymentUrl);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không thể mở liên kết VNPAY')),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(payment?.message ?? 'Thanh toán VNPAY thất bại')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối VNPAY: $e')),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  String _getPaymentName(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cod:
        return 'Thanh toán khi nhận hàng (COD)';
      case PaymentMethod.momo:
        return 'MoMo Wallet';
      case PaymentMethod.vnpay:
        return 'VNPAY';
    }
  }

  Widget _buildPaymentCard(PaymentMethod method) {
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
      onTap: () => setState(() => _selectedPaymentMethod = method),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: isSelected ? color : Colors.grey.shade300, width: isSelected ? 2 : 1),
          borderRadius: BorderRadius.circular(8),
          color: isSelected ? color.withOpacity(0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                _getPaymentName(method),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected) Icon(Icons.check_circle, color: color),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoForm() {
    if (_selectedPaymentMethod == null) return const SizedBox.shrink();

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
              const Text('THÔNG TIN GIAO HÀNG', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                decoration: InputDecoration(
                  labelText: 'Địa chỉ giao hàng *',
                  prefixIcon: const Icon(Icons.location_on),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                maxLines: 2,
                validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập địa chỉ' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: InputDecoration(
                  labelText: 'Số điện thoại *',
                  prefixIcon: const Icon(Icons.phone),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                keyboardType: TextInputType.phone,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Vui lòng nhập số điện thoại';
                  if (v.length < 10) return 'Số điện thoại không hợp lệ';
                  return null;
                },
              ),
              if (_selectedPaymentMethod == PaymentMethod.vnpay) ...[
                const SizedBox(height: 16),
                const Text('Chọn phương thức thanh toán (Tùy chọn)'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedBankCode,
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.account_balance),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  hint: const Text('Chọn phương thức'),
                  items: _vnpayBanks.map((b) => DropdownMenuItem(
                    value: b['code'],
                    child: Text(b['name']!),
                  )).toList(),
                  onChanged: (v) => setState(() => _selectedBankCode = v),
                ),
              ]
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final subtotal = _cart.subTotal;
    const shipping = 20.0;
    final total = subtotal + shipping;

    return Scaffold(
      appBar: AppBar(title: const Text('Thanh toán')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('CHỌN PHƯƠNG THỨC THANH TOÁN', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildPaymentCard(PaymentMethod.cod),
            _buildPaymentCard(PaymentMethod.momo),
            _buildPaymentCard(PaymentMethod.vnpay),
            const SizedBox(height: 24),
            _buildInfoForm(),
            const SizedBox(height: 24),
            Text('TỔNG: \$${total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isProcessing ? null : _handlePayment,
              child: _isProcessing
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(
                      _selectedPaymentMethod == null
                          ? 'HOÀN TẤT'
                          : _selectedPaymentMethod == PaymentMethod.cod
                              ? 'ĐẶT HÀNG'
                              : 'THANH TOÁN NGAY',
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
