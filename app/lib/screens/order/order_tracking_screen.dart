import 'package:flutter/material.dart';
import '../../services/order_service.dart';
import '../../models/order.dart';
import 'order_detail_screen.dart';

// Màu chủ đạo - ĐÃ ĐỒNG BỘ THEO YÊU CẦU
const Color _primaryColor = Color(0xFF40BFFF); // Màu xanh dương chính
const Color _lightGrey = Color(0xFFE0E0E0);
const Color _textColor = Colors.black87; // Màu chữ chính
const Color _unselectedTabColor = Color(0xFF9E9E9E); // Màu cho tab không được chọn

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  final OrderService _orderService = OrderService();
  List<OrderModel> orders = [];
  bool _isLoading = true;
  String _selectedTab = 'All'; // Thêm trạng thái tab để lọc

  @override
  void initState() {
    super.initState();
    loadOrders();
  }

  Future<void> loadOrders() async {
    try {
      final list = await _orderService.getTrackingOrders();
      setState(() {
        orders = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      print("⚠️ Lỗi load orders: $e");
    }
  }

  // Hàm này được giữ nguyên
  String getStatusText(String s) {
    return {
      "pending": "Chờ xác nhận",
      "confirmed": "Đã xác nhận",
      "processing": "Đang chuẩn bị hàng",
      "shipped": "Đang giao",
      "delivered": "Đã giao",
      "cancelled": "Đã hủy",
    }[s] ?? s;
  }

  // Hàm mới để lấy màu sắc cho trạng thái (đã cập nhật màu sắc để phù hợp với _primaryColor)
  Color getStatusColor(String status) {
    switch (status) {
      case 'shipped': // Coming
        return Colors.teal.shade500; // Giữ màu xanh lá cây đậm cho "Coming"
      case 'delivered': // Received
        return _primaryColor; // Màu xanh dương chính cho trạng thái thành công
      case 'cancelled':
        return Colors.redAccent;
      case 'pending':
      case 'confirmed':
      case 'processing': // Các trạng thái chờ
        return Colors.orange.shade800;
      default:
        return Colors.grey.shade600;
    }
  }

  // Widget riêng để xây dựng từng item đơn hàng
  Widget _buildOrderItemCard(OrderModel o) {
    final String statusText = getStatusText(o.status);
    final Color statusColor = getStatusColor(o.status);

    // Xác định văn bản hiển thị trong tag
    String tagText;
    if (o.status == 'shipped') {
      tagText = 'Coming';
    } else if (o.status == 'delivered') {
      tagText = 'Received';
    } else {
      tagText = statusText;
    }

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: o.id),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.only(bottom: 16.0), // Tăng khoảng cách dưới
        child: Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), // Bo góc 12
          child: Padding(
            padding: const EdgeInsets.all(16.0), // Tăng padding
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Placeholder cho ảnh sản phẩm
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.grey.shade100, // Màu nền placeholder
                  ),
                  child: const Icon(Icons.shopping_bag_outlined, color: Colors.grey, size: 30),
                ),

                const SizedBox(width: 16), // Khoảng cách

                // 2. Thông tin đơn hàng (Tên, Mã, Giá)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Đơn: ${o.orderCode}",
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700, // Đậm hơn
                          color: _textColor,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6), // Khoảng cách
                      Text(
                        getStatusText(o.status), // Trạng thái tiếng Việt
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 6), // Khoảng cách
                      Row(
                        children: [
                          const Icon(Icons.payments_outlined, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            "${o.totalPrice.toStringAsFixed(0)} đ", // Tổng tiền
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: _textColor,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // 3. Status Tag ở góc phải
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(20), // Bo góc tròn
                  ),
                  child: Text(
                    tagText,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: _primaryColor)), // Màu loading indicator
      );
    }

    // Lọc đơn hàng theo tab
    final filteredOrders = orders.where((o) {
      if (_selectedTab == 'All') return true;
      if (_selectedTab == 'Coming') return o.status == 'shipped';
      if (_selectedTab == 'Received') return o.status == 'delivered';
      return false;
    }).toList();


    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: _primaryColor), // Nút back màu xanh chủ đạo
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          "History", 
          style: TextStyle(
            fontWeight: FontWeight.bold, 
            fontSize: 24, 
            color: _primaryColor // Tiêu đề "History" màu xanh chủ đạo
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Row chứa các Tab (All, Coming, Received)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                _TabButton(
                  title: 'All', 
                  isSelected: _selectedTab == 'All', 
                  onTap: () => setState(() => _selectedTab = 'All'),
                ),
                _TabButton(
                  title: 'Coming', 
                  isSelected: _selectedTab == 'Coming', 
                  onTap: () => setState(() => _selectedTab = 'Coming'),
                ),
                _TabButton(
                  title: 'Received', 
                  isSelected: _selectedTab == 'Received', 
                  onTap: () => setState(() => _selectedTab = 'Received'),
                ),
              ],
            ),
          ),
          
          // Row Date Picker (Giả lập) - Giữ nguyên layout
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Text('From: 1/1/2019', style: TextStyle(color: Colors.grey, fontSize: 12)),
                Icon(Icons.arrow_drop_down, color: Colors.grey, size: 16),
                SizedBox(width: 20),
                Text('To: 1/12/2019', style: TextStyle(color: Colors.grey, fontSize: 12)),
                Icon(Icons.arrow_drop_down, color: Colors.grey, size: 16),
              ],
            ),
          ),

          // Danh sách đơn hàng
          Expanded(
            child: filteredOrders.isEmpty
                ? Center(
                  child: Text(
                    "Không có đơn hàng nào trong trạng thái '$_selectedTab'",
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 16, fontWeight: FontWeight.w500),
                  )
                )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    itemCount: filteredOrders.length,
                    itemBuilder: (context, i) {
                      final o = filteredOrders[i];
                      return _buildOrderItemCard(o); // Sử dụng widget Card mới
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

// Widget Tùy chỉnh cho Tab Button
class _TabButton extends StatelessWidget {
  final String title;
  final bool isSelected;
  final VoidCallback? onTap;
  
  const _TabButton({required this.title, required this.isSelected, this.onTap});

  // Màu chủ đạo - ĐÃ ĐỒNG BỘ THEO YÊU CẦU
  static const Color _primaryColor = Color(0xFF40BFFF); // Màu xanh dương chính
  static const Color _unselectedTabColor = Color(0xFF9E9E9E); // Màu cho tab không được chọn

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(right: 30.0), // Tăng khoảng cách
        child: Column(
          children: [
            Text(
              title,
              style: TextStyle(
                color: isSelected ? _primaryColor : _unselectedTabColor, // Màu xanh chủ đạo cho tab được chọn
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500, // Đậm và mỏng hơn
                fontSize: 15,
              ),
            ),
            if (isSelected)
              Container(
                margin: const EdgeInsets.only(top: 6),
                height: 3, // Dày hơn
                width: 30,
                decoration: BoxDecoration(
                  color: _primaryColor, // Thanh dưới của tab màu xanh chủ đạo
                  borderRadius: BorderRadius.circular(2), // Bo góc cho thanh dưới
                ),
              ),
          ],
        ),
      ),
    );
  }
}