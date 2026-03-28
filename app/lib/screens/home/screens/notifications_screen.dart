import 'package:flutter/material.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  // 👇 Bộ màu thương hiệu KZONE Central
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneOrange = Color(0xFFA0522D);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

  @override
  Widget build(BuildContext context) {
    // Dữ liệu giả (Mock Data) để giao diện trông giống app thật
    final List<Map<String, dynamic>> notifications = [
      {
        'title': 'Đơn hàng đang được giao! 🚚',
        'body': 'Đơn hàng #KZ1903 của bạn đang trên đường vận chuyển. Vui lòng chú ý điện thoại nhé.',
        'time': '10 phút trước',
        'icon': Icons.local_shipping_rounded,
        'color': Colors.green.shade600,
        'isUnread': true,
      },
      {
        'title': '🔥 Flash Sale: Mùa đông không lạnh',
        'body': 'Giảm ngay 50% cho toàn bộ áo khoác len và áo phao. Nhanh tay kẻo lỡ!',
        'time': '2 giờ trước',
        'icon': Icons.local_fire_department_rounded,
        'color': kzoneOrange,
        'isUnread': true,
      },
      {
        'title': 'Gợi ý phối đồ riêng cho bạn ✨',
        'body': 'AI của KZONE vừa tìm thấy những mẫu áo sơ mi cực hợp với phong cách của bạn. Xem ngay!',
        'time': 'Hôm qua',
        'icon': Icons.auto_awesome,
        'color': kzoneBrown,
        'isUnread': false,
      },
      {
        'title': 'Đánh giá sản phẩm',
        'body': 'Bạn thấy chiếc Áo Polo KZONE thế nào? Hãy để lại đánh giá để nhận 100 điểm tích lũy nhé.',
        'time': '20/11/2025',
        'icon': Icons.star_rounded,
        'color': Colors.amber.shade600,
        'isUnread': false,
      },
      {
        'title': 'Cập nhật hệ thống',
        'body': 'Ứng dụng vừa được nâng cấp tính năng Live Stream. Trải nghiệm ngay hôm nay.',
        'time': '18/11/2025',
        'icon': Icons.system_update_rounded,
        'color': Colors.blue.shade600,
        'isUnread': false,
      },
    ];

    return Scaffold(
      backgroundColor: kzoneBeige, // Nền Beige đồng bộ
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        shadowColor: kzoneBrown.withValues(alpha: 0.1),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: kzoneBrown, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Thông Báo',
          style: TextStyle(
            color: kzoneBrown,
            fontSize: 20,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: kzoneBrown),
            tooltip: 'Đánh dấu đã đọc tất cả',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Đã đánh dấu đọc tất cả'),
                  backgroundColor: kzoneBrown,
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.symmetric(vertical: 16),
        itemCount: notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final notif = notifications[i];
          final bool isUnread = notif['isUnread'];

          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: isUnread ? Colors.white : Colors.white.withValues(alpha: 0.6), // Mờ đi nếu đã đọc
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isUnread ? kzoneBrown.withValues(alpha: 0.2) : Colors.transparent,
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () {
                },
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 👇 Icon Thông báo (Được bọc trong vòng tròn màu)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: (notif['color'] as Color).withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          notif['icon'],
                          color: notif['color'],
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 16),
                      
                      // 👇 Nội dung
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Text(
                                    notif['title'],
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: isUnread ? FontWeight.bold : FontWeight.w600,
                                      color: Colors.black87,
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                                if (isUnread) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    width: 10,
                                    height: 10,
                                    margin: const EdgeInsets.only(top: 4),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              notif['body'],
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade600,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              notif['time'],
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey.shade400,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}