import 'package:flutter/material.dart';

class HomeDrawer extends StatelessWidget {
  final String username;
  final String email;
  final VoidCallback onNavigateToCart;
  final VoidCallback onLogout;

  const HomeDrawer({
    super.key,
    required this.username,
    required this.email,
    required this.onNavigateToCart,
    required this.onLogout,
  });

  // 👇 Màu sắc thương hiệu
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneLightBrown = Color(0xFFC4A484);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          // 👇 Header cao cấp với dải Gradient Nâu
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [kzoneBrown, kzoneLightBrown],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            accountName: Text(
              username.isNotEmpty ? username : 'Khách hàng VIP',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            accountEmail: Text(
              email.isNotEmpty ? email : 'Chào mừng đến với KZONE Central',
              style: const TextStyle(
                fontSize: 13,
                color: Colors.white70,
              ),
            ),
            currentAccountPicture: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  )
                ],
              ),
              child: CircleAvatar(
                backgroundColor: kzoneBeige,
                child: Text(
                  username.isNotEmpty ? username[0].toUpperCase() : 'K',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: kzoneBrown,
                  ),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 8),

          // 👇 Các Menu chức năng (Việt hóa & Đổi icon)
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              physics: const BouncingScrollPhysics(),
              children: [
                _buildDrawerItem(
                  icon: Icons.home_rounded,
                  title: 'Trang chủ',
                  onTap: () => Navigator.pop(context),
                ),
                _buildDrawerItem(
                  icon: Icons.auto_awesome,
                  title: 'Trợ lý ảo AI',
                  isHighlight: true, // Nhấn mạnh tính năng AI của đồ án
                  onTap: () {
                    Navigator.pop(context);
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.shopping_cart_rounded,
                  title: 'Giỏ hàng của tôi',
                  onTap: () {
                    Navigator.pop(context);
                    onNavigateToCart();
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.local_shipping_rounded,
                  title: 'Theo dõi đơn hàng',
                  onTap: () {
                    Navigator.pop(context);
                    // Chuyển sang tab Đơn hàng (Bạn có thể xử lý điều hướng sau)
                  },
                ),
                _buildDrawerItem(
                  icon: Icons.favorite_rounded,
                  title: 'Sản phẩm yêu thích',
                  onTap: () => Navigator.pop(context),
                ),
                
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  child: Divider(color: Colors.grey.shade200),
                ),
                
                _buildDrawerItem(
                  icon: Icons.person_rounded,
                  title: 'Tài khoản cá nhân',
                  onTap: () => Navigator.pop(context),
                ),
                _buildDrawerItem(
                  icon: Icons.settings_rounded,
                  title: 'Cài đặt',
                  onTap: () => Navigator.pop(context),
                ),
                _buildDrawerItem(
                  icon: Icons.support_agent_rounded,
                  title: 'Trung tâm hỗ trợ',
                  onTap: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // 👇 Phần Đăng xuất ở dưới cùng
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton.icon(
                onPressed: onLogout,
                icon: const Icon(Icons.logout_rounded, size: 20),
                label: const Text(
                  'ĐĂNG XUẤT',
                  style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade50,
                  foregroundColor: Colors.red.shade600,
                  elevation: 0,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Hàm helper để vẽ các dòng Menu cho sạch code
  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool isHighlight = false,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 2),
      leading: Icon(
        icon,
        color: isHighlight ? const Color(0xFFA0522D) : Colors.grey.shade600,
        size: 26,
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 15,
          fontWeight: isHighlight ? FontWeight.bold : FontWeight.w500,
          color: isHighlight ? const Color(0xFFA0522D) : Colors.black87,
        ),
      ),
      trailing: isHighlight 
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFA0522D).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text('MỚI', style: TextStyle(color: Color(0xFFA0522D), fontSize: 10, fontWeight: FontWeight.bold)),
            )
          : null,
      onTap: onTap,
    );
  }
}