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

  @override
  void initState() {
    super.initState();
    loadOrders();
  }

  Future<void> loadOrders() async {
    try {
      // Giả lập dữ liệu mẫu nếu OrderModel không có trường ảnh/tên sản phẩm chi tiết.
      // Nếu bạn muốn hiển thị ảnh, bạn cần đảm bảo OrderModel của bạn có trường đó.
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
    }[s] ?? s;
  }

  // Hàm mới để lấy màu sắc cho trạng thái (tùy chỉnh cho giao diện đẹp hơn)
  Color getStatusColor(String status) {
    switch (status) {
      case 'shipped': // Tương đương với "Coming"
        return Colors.teal;
      case 'delivered': // Tương đương với "Received"
        return Colors.redAccent;
      default:
        return Colors.grey.shade400;
    }
  }

  // Widget riêng để xây dựng từng item đơn hàng (thay thế ListTile)
  Widget _buildOrderItemCard(OrderModel o) {
    final String statusText = getStatusText(o.status);
    final Color statusColor = getStatusColor(o.status);

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
        padding: const EdgeInsets.only(bottom: 12.0),
        child: Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Placeholder cho ảnh sản phẩm
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.grey.shade200, // Màu nền placeholder
                    // Nếu OrderModel có trường imageUrl, bạn có thể dùng:
                    // image: DecorationImage(image: NetworkImage(o.items.first.imageUrl), fit: BoxFit.cover)
                  ),
                  child: const Icon(Icons.shopping_bag_outlined, color: Colors.grey, size: 30),
                ),

                const SizedBox(width: 12),

                // 2. Thông tin đơn hàng (Tên, Mã, Giá)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Giả định dùng Mã đơn hàng làm tiêu đề (hoặc tên sản phẩm nếu có)
                      Text(
                        "Đơn: ${o.orderCode}",
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        statusText, // Trạng thái
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.payments_outlined, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            "${o.totalPrice.toStringAsFixed(0)} đ", // Tổng tiền
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // 3. Status Tag ở góc phải (sử dụng layout giống như ảnh mẫu)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    // Sử dụng "Coming" và "Received" cho giao diện giống ảnh
                    o.status == 'shipped' ? 'Coming' : (o.status == 'delivered' ? 'Received' : statusText),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
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
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      // Chỉnh sửa AppBar cho giống giao diện "History"
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text("History", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Row chứa các Tab (All, Coming, Received) - Thêm layout tabs
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                // Giả lập tab 'All' được chọn
                _TabButton(title: 'All', isSelected: true),
                _TabButton(title: 'Coming', isSelected: false),
                _TabButton(title: 'Received', isSelected: false),
              ],
            ),
          ),
          
          // Row Date Picker (Giả lập)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                const Text('From: 1/1/2019', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const Icon(Icons.arrow_drop_down, color: Colors.grey, size: 16),
                const SizedBox(width: 20),
                const Text('To: 1/12/2019', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const Icon(Icons.arrow_drop_down, color: Colors.grey, size: 16),
              ],
            ),
          ),

          // ListView.builder đã được thay đổi
          Expanded(
            child: orders.isEmpty
                ? const Center(child: Text("Không có đơn hàng"))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    itemCount: orders.length,
                    itemBuilder: (context, i) {
                      final o = orders[i];
                      return _buildOrderItemCard(o); // Sử dụng widget Card mới
                    },
                  ),
          ),
        ],
      ),
      // Giả lập Bottom Navigation Bar
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_cart_outlined), label: 'Cart'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite_border), label: 'Wishlist'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'My'),
        ],
        currentIndex: 4, 
        selectedItemColor: Colors.black,
        unselectedItemColor: Colors.grey,
        showSelectedLabels: false,
        showUnselectedLabels: false,
      ),
    );
  }
}

// Widget Tùy chỉnh cho Tab Button
class _TabButton extends StatelessWidget {
  final String title;
  final bool isSelected;
  
  const _TabButton({required this.title, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 20.0),
      child: Column(
        children: [
          Text(
            title,
            style: TextStyle(
              color: isSelected ? Colors.black : Colors.grey,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          if (isSelected)
            Container(
              margin: const EdgeInsets.only(top: 4),
              height: 2,
              width: 30,
              color: Colors.black,
            ),
        ],
      ),
    );
  }
}