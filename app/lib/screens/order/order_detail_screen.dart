import 'package:flutter/material.dart';
import '../../models/order.dart'; // Đảm bảo OrderModel có các thuộc tính: orderCode, items, totalPrice, shippingFee, shippingAddress, status, notes

class OrderDetailScreen extends StatelessWidget {
  final OrderModel order;

  const OrderDetailScreen({super.key, required this.order});

  // --- Các hàm Status được giữ nguyên ---

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

  // IconData _getStatusIcon(String status) { ... } (Không dùng trong layout mới)

  // --- Widget Build Mới ---

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Chi tiết đơn ${order.orderCode}'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0.5,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. Order Details & Status Timeline (Tương tự phần trên cùng bên phải)
          _buildDetailCard(
            context,
            title: 'Đơn hàng #${order.orderCode}',
            children: [
              // Mô phỏng thanh trạng thái
              _buildOrderStatusTimeline(order.status),
              const SizedBox(height: 12),
              
              // Tóm tắt đơn hàng (Subtotal, Shipping Fee, Total)
              _buildSummaryRow('Tổng phụ', '${order.totalPrice.toStringAsFixed(0)} ₫'),
              if (order.shippingFee > 0)
                _buildSummaryRow('Phí vận chuyển', '+ ${order.shippingFee.toStringAsFixed(0)} ₫'),
              const Divider(height: 16),
              _buildSummaryRow(
                'Tổng cộng', 
                '${(order.totalPrice + order.shippingFee).toStringAsFixed(0)} ₫', 
                isTotal: true
              ),
            ],
          ),

          const SizedBox(height: 16),

          // 2. Product List (Tương tự phần sản phẩm trong hình)
          _buildDetailCard(
            context,
            title: 'Sản phẩm',
            children: order.items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image Placeholder
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                      // Thêm Placeholder ảnh sản phẩm
                      // Thay thế bằng NetworkImage nếu bạn có URL ảnh sản phẩm
                    ),
                    child: Center(child: Text('Ảnh', style: TextStyle(color: Colors.grey[600]))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w600)),
                        Text('Màu: Black / X ${item.quantity}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                        Text('${item.subtotal.toStringAsFixed(0)} ₫', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
            )).toList(),
          ),

          const SizedBox(height: 16),

          // 3. Shipping Address (Tương tự phần địa chỉ trong hình)
          _buildDetailCard(
            context,
            title: 'Địa chỉ giao hàng',
            children: [
              Text(
                '${order.shippingAddress?.address ?? 'N/A'}\n'
                '${order.shippingAddress?.fullName ?? ''}, SĐT: ${order.shippingAddress?.phone ?? ''}',
                style: const TextStyle(fontSize: 14),
              ),
              if (order.notes != null && order.notes!.isNotEmpty)
                 Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text('Ghi chú: ${order.notes!}', style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.blueGrey)),
                ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Nút hành động (Ví dụ: Yêu cầu hủy)
          if (order.status.toLowerCase() == 'pending' || order.status.toLowerCase() == 'processing')
            ElevatedButton(
              onPressed: () {
                // Xử lý logic yêu cầu hủy
                _showCancelConfirmation(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade400,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Yêu cầu Hủy Đơn hàng'),
            ),
        ],
      ),
    );
  }

  // Helper Widget: Card bọc nội dung
  Widget _buildDetailCard(BuildContext context, {required String title, required List<Widget> children}) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
            const Divider(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }

  // Helper Widget: Hàng tóm tắt thanh toán
  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: isTotal ? Colors.black : Colors.grey[700])),
          Text(
            value,
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
              color: isTotal ? Colors.black87 : Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  // Helper Widget: Thanh tiến trình trạng thái
  Widget _buildOrderStatusTimeline(String status) {
    // Trạng thái đơn giản cho timeline (Giống như trong hình)
    final List<Map<String, String>> timelineStages = [
      {'key': 'ordered', 'label': 'Đã đặt', 'date': '20 Oct 2018'}, // Giả định
      {'key': 'processing', 'label': 'Đang xử lý', 'date': ''},
      {'key': 'shipped', 'label': 'Đang giao', 'date': ''},
      {'key': 'delivered', 'label': 'Đã giao', 'date': ''},
    ];
    final currentStatusKey = status.toLowerCase();
    int currentIndex = timelineStages.indexWhere((stage) => stage['key'] == currentStatusKey);
    // Nếu trạng thái là delivered, lấy index của delivered
    if (currentStatusKey == 'delivered') currentIndex = 3; 

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Dòng trạng thái hiện tại (Giống như "Order Status" trong hình)
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Trạng thái đơn hàng', 
              style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey[700])
            ),
            // Hiển thị trạng thái hiện tại (Text)
            Text(
              _getStatusText(status),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: _getStatusColor(status)
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        // Timeline Horizontal
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(timelineStages.length, (index) {
            final isCompleted = index <= currentIndex;
            final isLast = index == timelineStages.length - 1;
            final color = isCompleted ? Colors.blueAccent : Colors.grey.shade300;

            return Expanded(
              flex: isLast ? 0 : 1,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        isCompleted ? Icons.check_circle : Icons.circle_outlined,
                        color: color,
                        size: 20,
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
                        width: isLast ? 50 : 70, // Đảm bảo text không bị tràn
                        child: Text(
                          timelineStages[index]['label']!,
                          style: TextStyle(fontSize: 10, color: color),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                        ),
                      ),
                    ],
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        height: 2,
                        margin: const EdgeInsets.only(top: 9, left: 4, right: 4),
                        color: color,
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
      ],
    );
  }
  
  // Hàm hiển thị dialog xác nhận hủy
  void _showCancelConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận Hủy Đơn hàng'),
        content: const Text('Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy bỏ'),
          ),
          ElevatedButton(
            onPressed: () {
              // Thực hiện logic hủy đơn hàng ở đây
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Yêu cầu hủy đơn hàng đã được gửi.')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Xác nhận Hủy', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}