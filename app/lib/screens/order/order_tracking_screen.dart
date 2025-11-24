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
  bool loading = true;
  List<OrderModel> orders = [];
  String? errorMsg;
  String _currentFilter = 'all'; // Thêm bộ lọc

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() {
      loading = true;
      errorMsg = null;
    });

    try {
      // Giả định OrderService có thể lọc đơn hàng, nếu không bạn cần lọc ở client
      final data = await _orderService.getTrackingOrders(); 
      if (mounted) {
        setState(() {
          orders = data;
          loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          errorMsg = e.toString().replaceAll('Exception: ', '');
          loading = false;
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'processing': return Colors.orange;
      case 'shipped': return Colors.blue;
      case 'delivered': return Colors.green;
      case 'pending':
      case 'unconfirmed': return Colors.grey;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'pending': return 'Chờ xác nhận';
      case 'unconfirmed': return 'Chưa xác nhận';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  }

  // Phương thức lọc đơn hàng
  List<OrderModel> _getFilteredOrders() {
    if (_currentFilter == 'all') {
      return orders;
    }
    return orders.where((order) => order.status.toLowerCase() == _currentFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    // Danh sách các trạng thái để làm tab/filter
    const List<Map<String, String>> filters = [
      {'key': 'all', 'label': 'Tất cả'},
      {'key': 'processing', 'label': 'Đang xử lý'},
      {'key': 'shipped', 'label': 'Đang giao'},
      {'key': 'delivered', 'label': 'Đã giao'},
      {'key': 'cancelled', 'label': 'Đã hủy'},
    ];

    final filteredOrders = _getFilteredOrders();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Đơn hàng của tôi'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
        // Dùng drawer cho menu như hình ảnh
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadOrders)
        ],
      ),
      // Giả định có Drawer cho menu bên trái
      drawer: const Drawer(
        child: Center(child: Text('Nội dung Menu')),
      ),
      body: Column(
        children: [
          // Filter Tabs (giống như "All", "Paid", "Delivered" trong hình)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 12.0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: filters.map((filter) {
                  final isSelected = _currentFilter == filter['key'];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                    child: ChoiceChip(
                      label: Text(filter['label']!),
                      selected: isSelected,
                      selectedColor: Colors.blueAccent.withOpacity(0.8),
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.black87,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _currentFilter = filter['key']!;
                          });
                          // Có thể gọi lại _loadOrders với filter mới nếu API hỗ trợ
                        }
                      },
                      backgroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(
                          color: isSelected ? Colors.blueAccent : Colors.grey.shade300,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : errorMsg != null
                    ? Center(child: Text(errorMsg!))
                    : filteredOrders.isEmpty
                        ? const Center(child: Text('Không có đơn hàng nào'))
                        : RefreshIndicator(
                            onRefresh: _loadOrders,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(12),
                              itemCount: filteredOrders.length,
                              itemBuilder: (context, index) {
                                final order = filteredOrders[index];
                                return _buildOrderCard(context, order);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, OrderModel order) {
    // Lấy 1-2 sản phẩm đầu tiên để hiển thị như trong hình
    final firstItem = order.items.isNotEmpty ? order.items.first : null;
    final statusColor = _getStatusColor(order.status);
    final statusText = _getStatusText(order.status);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Code & Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Order #${order.orderCode}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(),
            
            // Product Info (lấy sản phẩm đầu tiên)
            if (firstItem != null)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image (Giả định có widget hiển thị ảnh, nếu không thì dùng placeholder)
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                      // Thêm Placeholder ảnh sản phẩm
                      image: const DecorationImage(
                          image: AssetImage('assets/product_placeholder.png'), // Thay bằng ảnh thật
                          fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          firstItem.productName,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'Số lượng: ${firstItem.quantity}',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        Text(
                          '${firstItem.subtotal.toStringAsFixed(0)} ₫',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
                        ),
                        if (order.items.length > 1) 
                          Text(
                            '+ ${order.items.length - 1} sản phẩm khác',
                            style: TextStyle(color: Colors.grey[500], fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                  // Nút Chat (nếu cần)
                  // Align(
                  //   alignment: Alignment.topRight,
                  //   child: TextButton.icon(
                  //     onPressed: () {}, 
                  //     icon: const Icon(Icons.chat_bubble_outline, size: 16), 
                  //     label: const Text('Chat'),
                  //   ),
                  // )
                ],
              ),
            
            const SizedBox(height: 12),

            // Total Price
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Tổng tiền:', style: TextStyle(color: Colors.grey[700])),
                Text(
                  '${order.totalPrice.toStringAsFixed(0)} ₫',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Action Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                // Nút "Refund" (giả định chỉ hiện cho đơn "Đã giao" hoặc tùy logic)
                if (order.status.toLowerCase() == 'delivered')
                  OutlinedButton(
                    onPressed: () {
                      // Xử lý Refund
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red, 
                      side: const BorderSide(color: Colors.red),
                    ),
                    child: const Text('Hoàn tiền'),
                  ),
                const SizedBox(width: 8),
                
                // Nút "Details"
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => OrderDetailScreen(order: order),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent, // Màu chính
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                  ),
                  child: const Text('Chi tiết'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}