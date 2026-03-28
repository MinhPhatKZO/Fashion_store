import 'package:flutter/material.dart';
import '../../services/order_service.dart';
import '../../models/order.dart';
import 'order_detail_screen.dart';

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState(); 
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  final OrderService _orderService = OrderService();
  List<OrderModel> orders = [];
  bool _isLoading = true;
  String _selectedTab = 'Tất cả'; // Việt hóa tab mặc định

  // 👇 Khai báo bộ màu thương hiệu KZONE Central
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneOrange = Color(0xFFA0522D);
  static const Color kzoneBeige = Color(0xFFFAF7F2);
  static const Color _unselectedTabColor = Color(0xFF9E9E9E);

  @override
  void initState() {
    super.initState();
    loadOrders();
  }

  Future<void> loadOrders() async {
    try {
      final list = await _orderService.getTrackingOrders();
      if (!mounted) return; 
      setState(() {
        orders = list;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  String getStatusText(String s) {
    return {
      "pending": "Chờ xác nhận",
      "confirmed": "Đã xác nhận",
      "processing": "Đang chuẩn bị",
      "shipped": "Đang giao hàng",
      "delivered": "Đã giao hàng",
      "cancelled": "Đã hủy",
    }[s] ?? s;
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'shipped':
        return Colors.blue.shade700;
      case 'delivered':
        return Colors.green.shade700;
      case 'cancelled':
        return Colors.red.shade700;
      case 'pending':
      case 'confirmed':
      case 'processing':
        return kzoneOrange;
      default:
        return Colors.grey.shade600;
    }
  }

  // 👇 Hàm định dạng tiền VNĐ chuẩn
  String _formatCurrency(double price) {
    String priceStr = price.toStringAsFixed(0);
    priceStr = priceStr.replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.');
    return '$priceStr₫';
  }

  Widget _buildOrderItemCard(OrderModel o) {
    final Color statusColor = getStatusColor(o.status);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: o.id),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20), 
          boxShadow: [
            BoxShadow(
              color: kzoneBrown.withValues(alpha: 0.06),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
          border: Border.all(color: kzoneBrown.withValues(alpha: 0.05)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header của Card: Mã đơn và Trạng thái
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.receipt_long_rounded, color: kzoneBrown, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      "Đơn: ${o.orderCode}",
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    getStatusText(o.status),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Divider(height: 1, thickness: 0.5),
            ),

            // Nội dung chính: Ảnh (giả định) và Giá
            Row(
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: kzoneBeige,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.inventory_2_outlined, color: kzoneBrown, size: 30),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Tổng thanh toán",
                        style: TextStyle(fontSize: 13, color: Colors.grey),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatCurrency(o.totalPrice),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: kzoneBrown,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Footer của Card: Icon vận chuyển
            Row(
              children: [
                Icon(Icons.local_shipping_outlined, size: 16, color: statusColor),
                const SizedBox(width: 6),
                Text(
                  "Cập nhật đơn hàng lúc 10:30, 20/03/2026", // Mock time
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 11,
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: kzoneBeige,
        body: Center(child: CircularProgressIndicator(color: kzoneBrown)),
      );
    }

    final filteredOrders = orders.where((o) {
      if (_selectedTab == 'Tất cả') return true;
      if (_selectedTab == 'Đang giao') return o.status == 'shipped';
      if (_selectedTab == 'Đã nhận') return o.status == 'delivered';
      return false;
    }).toList();

    return Scaffold(
      backgroundColor: kzoneBeige,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: kzoneBrown, size: 22),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          "LỊCH SỬ ĐƠN HÀNG",
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 18,
            color: kzoneBrown,
            letterSpacing: 1.2,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
      ),

      body: Column(
        children: [
          // 👇 Thanh Tab tùy chỉnh
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _TabButton(
                  title: 'Tất cả',
                  isSelected: _selectedTab == 'Tất cả',
                  onTap: () => setState(() => _selectedTab = 'Tất cả'),
                ),
                _TabButton(
                  title: 'Đang giao',
                  isSelected: _selectedTab == 'Đang giao',
                  onTap: () => setState(() => _selectedTab = 'Đang giao'),
                ),
                _TabButton(
                  title: 'Đã nhận',
                  isSelected: _selectedTab == 'Đã nhận',
                  onTap: () => setState(() => _selectedTab = 'Đã nhận'),
                ),
              ],
            ),
          ),

          // Bộ lọc ngày tháng (Giao diện tinh gọn hơn)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              children: [
                Icon(Icons.calendar_today_rounded, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 8),
                Text('Từ: 01/01/2026  -  Đến: 31/12/2026',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
              ],
            ),
          ),

          Expanded(
            child: filteredOrders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.assignment_late_outlined, size: 80, color: kzoneBrown.withValues(alpha: 0.2)),
                        const SizedBox(height: 16),
                        Text(
                          "Chưa có đơn hàng nào",
                          style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 16,
                              fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filteredOrders.length,
                    itemBuilder: (context, i) =>
                        _buildOrderItemCard(filteredOrders[i]),
                  ),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String title;
  final bool isSelected;
  final VoidCallback? onTap;

  const _TabButton({required this.title, required this.isSelected, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Text(
            title,
            style: TextStyle(
              color: isSelected ? const Color(0xFF8B4513) : const Color(0xFF9E9E9E),
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w500,
            ),
          ),
          const SizedBox(height: 6),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: isSelected ? 40 : 0,
            height: 3,
            decoration: BoxDecoration(
              color: const Color(0xFF8B4513),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ],
      ),
    );
  }
}