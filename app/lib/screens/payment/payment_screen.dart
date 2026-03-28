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

  // 👇 Màu sắc thương hiệu KZONE
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneBeige = Color(0xFFFAF7F2);
  static const Color kzoneOrange = Color(0xFFA0522D);

  String? _selectedBankCode;
  final List<Map<String, String>> _vnpayBanks = [
    {'code': '', 'name': 'Cổng thanh toán VNPAYQR'},
    {'code': 'VNPAYQR', 'name': 'Ứng dụng hỗ trợ VNPAYQR'},
    {'code': 'VNBANK', 'name': 'Thẻ ATM / Tài khoản nội địa'},
    {'code': 'INTCARD', 'name': 'Thẻ quốc tế (Visa, Master,...) '},
  ];

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  // 👇 Hàm định dạng tiền VNĐ
  String _formatCurrency(double price) {
    String priceStr = price.toStringAsFixed(0);
    priceStr = priceStr.replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.');
    return '$priceStr₫';
  }

  Future<void> _handlePayment() async {
    if (_selectedPaymentMethod == null) {
      _showError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final orderId = "KZONE_${DateTime.now().millisecondsSinceEpoch}";
    final totalAmount = _cart.subTotal + 30000; // Phí ship 30k VNĐ

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

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.redAccent),
    );
  }

  Future<void> _processCOD(String orderId, double amount) async {
    setState(() => _isProcessing = true);
    await Future.delayed(const Duration(seconds: 2)); // Giả lập xử lý
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('🎉 Đặt hàng thành công! KZONE sẽ sớm liên hệ bạn.'), backgroundColor: kzoneBrown),
    );
    await _cart.clear();
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  // Logic MoMo & VNPay giữ nguyên nhưng bọc trong UI mới
  Future<void> _processMoMo(String orderId, double amount) async {
    setState(() => _isProcessing = true);
    try {
      final service = MoMoService();
      final payment = await service.createPayment(orderId, amount);
      if (!mounted) return;

      if (payment != null && payment.payUrl.isNotEmpty) {
        final url = Uri.parse(payment.payUrl);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } else {
          _showError('Không thể mở ứng dụng MoMo');
        }
      }
    } catch (e) {
      _showError('Lỗi kết nối MoMo');
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _processVNPay(String orderId, double amount) async {
    setState(() => _isProcessing = true);
    try {
      final service = VNPayService();
      final payment = await service.createPayment(orderId, amount);
      if (!mounted) return;

      if (payment != null && payment.success && payment.paymentUrl.isNotEmpty) {
        final url = Uri.parse(payment.paymentUrl);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } else {
          _showError('Không thể mở liên kết VNPAY');
        }
      }
    } catch (e) {
      _showError('Lỗi kết nối VNPAY');
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _cart.subTotal + 30000;

    return Scaffold(
      backgroundColor: kzoneBeige,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: kzoneBrown, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('THANH TOÁN', style: TextStyle(color: kzoneBrown, fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 1.2)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('PHƯƠNG THỨC THANH TOÁN', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: kzoneBrown, letterSpacing: 0.5)),
            const SizedBox(height: 16),
            _buildPaymentCard(PaymentMethod.cod, 'Tiền mặt (COD)', Icons.payments_outlined, Colors.green),
            _buildPaymentCard(PaymentMethod.momo, 'Ví MoMo', Icons.account_balance_wallet_outlined, Colors.pink),
            _buildPaymentCard(PaymentMethod.vnpay, 'VNPAY / Ngân hàng', Icons.account_balance_outlined, Colors.blue),
            
            const SizedBox(height: 24),
            _buildInfoForm(),
            
            const SizedBox(height: 32),
            _buildOrderSummary(total),
            
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isProcessing ? null : _handlePayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: kzoneBrown,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                elevation: 0,
              ),
              child: _isProcessing
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_selectedPaymentMethod == PaymentMethod.cod ? 'ĐẶT HÀNG NGAY' : 'THANH TOÁN NGAY', 
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentCard(PaymentMethod method, String name, IconData icon, Color color) {
    final isSelected = _selectedPaymentMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentMethod = method),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? kzoneBrown : Colors.transparent, width: 2),
          boxShadow: [BoxShadow(color: kzoneBrown.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(child: Text(name, style: TextStyle(fontSize: 15, fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600))),
            if (isSelected) const Icon(Icons.check_circle_rounded, color: kzoneBrown),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoForm() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: kzoneBrown.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('THÔNG TIN NHẬN HÀNG', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: kzoneBrown)),
            const SizedBox(height: 16),
            _buildTextField(_addressController, 'Địa chỉ chi tiết', Icons.location_on_outlined),
            const SizedBox(height: 16),
            _buildTextField(_phoneController, 'Số điện thoại liên hệ', Icons.phone_android_outlined, isPhone: true),
            
            if (_selectedPaymentMethod == PaymentMethod.vnpay) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedBankCode,
                decoration: _inputDecoration('Phương thức VNPAY', Icons.account_balance),
                items: _vnpayBanks.map((b) => DropdownMenuItem(value: b['code'], child: Text(b['name']!, style: const TextStyle(fontSize: 13)))).toList(),
                onChanged: (v) => setState(() => _selectedBankCode = v),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummary(double total) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Tổng cộng', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
            Text(_formatCurrency(total), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: kzoneBrown)),
          ],
        ),
        const SizedBox(height: 4),
        const Text('(Đã bao gồm phí vận chuyển 30.000₫)', style: TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic)),
      ],
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {bool isPhone = false}) {
    return TextFormField(
      controller: controller,
      keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
      decoration: _inputDecoration(label, icon),
      validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng không để trống' : null,
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontSize: 13, color: Colors.grey),
      prefixIcon: Icon(icon, color: kzoneBrown, size: 20),
      filled: true,
      fillColor: kzoneBeige.withValues(alpha: 0.5),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kzoneBrown, width: 1)),
    );
  }
}