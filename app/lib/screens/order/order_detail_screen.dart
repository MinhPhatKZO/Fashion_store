import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/order_service.dart';
import '../../services/momo_service.dart';
import '../../services/vnpay_service.dart';
import '../../models/order.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({Key? key, required this.orderId}) : super(key: key);

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final OrderService _orderService = OrderService();
  final MoMoService _momoService = MoMoService();
  final VNPayService _vnpayService = VNPayService();

  OrderModel? order;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    try {
      final res = await _orderService.getOrderById(widget.orderId);
      setState(() {
        order = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      print(" Lỗi load order: $e");
    }
  }

  Future<void> _payMoMo() async {
    if (order == null) return;
    final payment = await _momoService.createPayment(order!.id, order!.totalPrice);
    if (payment != null && payment.payUrl.isNotEmpty) {
      launchUrl(Uri.parse(payment.payUrl), mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _payVNPay() async {
    if (order == null) return;
    final payment = await _vnpayService.createPayment(order!.id, order!.totalPrice);
    if (payment != null && payment.success && payment.paymentUrl.isNotEmpty) {
      launchUrl(Uri.parse(payment.paymentUrl), mode: LaunchMode.externalApplication);
    }
  }

  // --- HÀM HỖ TRỢ LAYOUT ---

  String _getStatusText(String s) {
    return {
      "pending": "Chờ xác nhận",
      "confirmed": "Đã xác nhận",
      "processing": "Đang chuẩn bị hàng",
      "shipped": "Đang giao",
      "delivered": "Đã giao",
    }[s] ?? s;
  }

  Color _getStatusColor(String s) {
    switch (s) {
      case "pending":
        return Colors.orange;
      case "delivered":
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

  // Widget hiển thị một mục chi tiết (Label/Value)
  Widget _buildDetailRow(String label, String value, {TextStyle? valueStyle, Color? labelColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label, 
              style: TextStyle(color: labelColor ?? Colors.grey.shade600, fontSize: 14),
            ),
          ),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: valueStyle ?? const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  // Widget hiển thị tiêu đề phần (Header Section)
  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, top: 16.0),
      child: Text(
        title,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
    );
  }

  // Widget hiển thị trạng thái đơn hàng nổi bật
  Widget _buildStatusSection(String status) {
    final statusText = _getStatusText(status);
    final statusColor = _getStatusColor(status);
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 16, top: 8),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Icon(Icons.access_time_filled, color: statusColor, size: 30),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Trạng thái hiện tại", style: TextStyle(fontSize: 14, color: Colors.grey)),
                  Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget hiển thị chi tiết sản phẩm trong danh sách
  Widget _buildProductItem(OrderItem item) {
    final double itemTotal = item.subtotal;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Placeholder Ảnh sản phẩm
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: Colors.grey.shade200,
            ),
            child: const Icon(Icons.shopping_bag_outlined, color: Colors.grey),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text("SL: x${item.quantity}", style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),
          Text(
            "${itemTotal.toStringAsFixed(0)}đ",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  // --- WIDGET BUILD CHÍNH ---

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    // ⚠️ KHỐI CODE ĐÃ SỬA LỖI CONST TRIỆT ĐỂ Ở ĐÂY
    if (order == null) {
      return Scaffold( // Bỏ const ở Scaffold
        appBar: AppBar(title: const Text("Chi tiết đơn hàng")),
        body: const Center(child: Text("Không thể tải thông tin đơn hàng")),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text("Đơn ${order!.orderCode}"),
        elevation: 1, // Thêm elevation nhẹ cho AppBar
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Trạng thái đơn hàng (Nổi bật)
            _buildStatusSection(order!.status),

            // 2. Chi tiết Sản phẩm
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), spreadRadius: 1, blurRadius: 5)],
              ),
              padding: const EdgeInsets.all(16.0),
              margin: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader("Sản phẩm đã đặt"),
                  const Divider(height: 1, thickness: 1, color: Colors.black12),
                  const SizedBox(height: 8),
                  ...order!.items.map((e) => _buildProductItem(e)).toList(),
                ],
              ),
            ),

            // 3. Thông tin giao hàng
            if (order!.shippingAddress != null)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), spreadRadius: 1, blurRadius: 5)],
                ),
                padding: const EdgeInsets.all(16.0),
                margin: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader("Thông tin giao hàng"),
                    const Divider(height: 1, thickness: 1, color: Colors.black12),
                    _buildDetailRow("Người nhận", order!.shippingAddress!.fullName, labelColor: Colors.black),
                    _buildDetailRow("SĐT", order!.shippingAddress!.phone, labelColor: Colors.black),
                    _buildDetailRow("Địa chỉ", order!.shippingAddress!.address, valueStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            
            // 4. Tổng kết thanh toán
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), spreadRadius: 1, blurRadius: 5)],
              ),
              padding: const EdgeInsets.all(16.0),
              margin: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader("Tổng kết thanh toán"),
                  const Divider(height: 1, thickness: 1, color: Colors.black12),
                  _buildDetailRow("Tổng tiền sản phẩm", "${order!.totalPrice.toStringAsFixed(0)}đ", labelColor: Colors.black),
                  _buildDetailRow("Phí vận chuyển", "0đ", labelColor: Colors.black), 
                  const Divider(height: 12, thickness: 1, color: Colors.black12),
                  _buildDetailRow(
                    "TỔNG THANH TOÁN", 
                    "${order!.totalPrice.toStringAsFixed(0)}đ", 
                    valueStyle: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red, fontSize: 18),
                    labelColor: Colors.black,
                  ),
                ],
              ),
            ),
            
            // 5. Nút Thanh toán (chỉ hiển thị khi status là "pending")
            if (order!.status == "pending") ...[
              const Padding(
                padding: EdgeInsets.only(bottom: 10),
                child: Text("Chọn phương thức thanh toán:", 
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              ElevatedButton.icon(
                onPressed: _payMoMo,
                icon: const Icon(Icons.wallet_travel, color: Colors.pink),
                label: const Text("Thanh toán với MoMo"),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  backgroundColor: Colors.pink.shade50,
                  foregroundColor: Colors.black87,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed: _payVNPay,
                icon: const Icon(Icons.credit_card, color: Colors.green),
                label: const Text("Thanh toán với VNPay"),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  backgroundColor: Colors.green.shade50,
                  foregroundColor: Colors.black87,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
              const SizedBox(height: 20),
            ]
          ],
        ),
      ),
    );
  }
}