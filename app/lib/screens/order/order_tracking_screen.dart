import 'package:flutter/material.dart';
import '../../services/order_service.dart';
import '../../models/order.dart';
import 'order_detail_screen.dart';

// ======= THEME =======
const Color _primaryColor = Color(0xFF40BFFF);
const Color _textColor = Colors.black87;
const Color _unselectedTabColor = Color(0xFF9E9E9E);

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState(); 
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  final OrderService _orderService = OrderService();
  List<OrderModel> orders = [];
  bool _isLoading = true;
  String _selectedTab = 'All';

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
    }
  }

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

  Color getStatusColor(String status) {
    switch (status) {
      case 'shipped':
        return Colors.teal.shade500;
      case 'delivered':
        return _primaryColor;
      case 'cancelled':
        return Colors.redAccent;
      case 'pending':
      case 'confirmed':
      case 'processing':
        return Colors.orange.shade800;
      default:
        return Colors.grey.shade600;
    }
  }

  // ==========================================
  //        🔥 NEW PROMOTION-STYLE CARD UI
  // ==========================================
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
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(bottom: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20), // Bo góc lớn
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.07),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: Colors.grey.shade200),
        ),
        padding: const EdgeInsets.all(18),
        child: Stack(
          children: [
            // Badge trạng thái
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: BorderRadius.circular(25),
                ),
                child: Text(
                  getStatusText(o.status),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ),

            // Nội dung chính
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Ảnh sản phẩm
                Container(
                  height: 110,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Center(
                    child: Icon(Icons.shopping_bag_outlined,
                        size: 45, color: Colors.grey),
                  ),
                ),
                const SizedBox(height: 14),

                // Tên đơn
                Text(
                  "Đơn: ${o.orderCode}",
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: _textColor,
                  ),
                ),
                const SizedBox(height: 8),

                // Tổng tiền
                Text(
                  "${o.totalPrice.toStringAsFixed(0)} đ",
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Colors.redAccent,
                  ),
                ),
                const SizedBox(height: 10),

                // Hàng ngang: Icon + trạng thái
                Row(
                  children: [
                    Icon(Icons.local_shipping_outlined,
                        size: 18, color: statusColor),
                    const SizedBox(width: 6),
                    Text(
                      getStatusText(o.status),
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                )
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: _primaryColor)),
      );
    }

    final filteredOrders = orders.where((o) {
      if (_selectedTab == 'All') return true;
      if (_selectedTab == 'Coming') return o.status == 'shipped';
      if (_selectedTab == 'Received') return o.status == 'delivered';
      return false;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: _primaryColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          "History",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 23,
            color: _primaryColor,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),

      // =============================
      //        BODY UI
      // =============================
      body: Column(
        children: [
          // TAB
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
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

          // Fake date picker bar
          const Padding(
            padding: EdgeInsets.only(left: 16, top: 5, bottom: 10),
            child: Row(
              children: [
                Text('From: 1/1/2019',
                    style: TextStyle(fontSize: 12, color: Colors.grey)),
                Icon(Icons.arrow_drop_down, size: 18, color: Colors.grey),
                SizedBox(width: 20),
                Text('To: 1/12/2019',
                    style: TextStyle(fontSize: 12, color: Colors.grey)),
                Icon(Icons.arrow_drop_down, size: 18, color: Colors.grey),
              ],
            ),
          ),

          Expanded(
            child: filteredOrders.isEmpty
                ? Center(
                    child: Text(
                      "Không có đơn hàng nào trong trạng thái '$_selectedTab'",
                      style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 16,
                          fontWeight: FontWeight.w500),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
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

// =========================
//        TAB WIDGET
// =========================
class _TabButton extends StatelessWidget {
  final String title;
  final bool isSelected;
  final VoidCallback? onTap;

  const _TabButton(
      {required this.title, required this.isSelected, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(right: 30),
        child: Column(
          children: [
            Text(
              title,
              style: TextStyle(
                color: isSelected ? _primaryColor : _unselectedTabColor,
                fontSize: 15,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
            if (isSelected)
              Container(
                margin: const EdgeInsets.only(top: 5),
                width: 30,
                height: 3,
                decoration: BoxDecoration(
                  color: _primaryColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
