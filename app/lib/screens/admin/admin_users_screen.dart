import 'package:flutter/material.dart';
import 'view_purchase_history_screen.dart';
import 'lock_unlock_account_screen.dart';
import 'staff_permission_screen.dart';

class AdminUserScreen extends StatelessWidget {
  const AdminUserScreen({Key? key}) : super(key: key);

  final List<_MenuItemData> _menuItems = const [
    _MenuItemData(
      title: "Xem lịch sử mua hàng KH",
      icon: Icons.history,
      screen: ViewPurchaseHistoryScreen(),
    ),
    _MenuItemData(
      title: "Khóa / Mở tài khoản",
      icon: Icons.lock,
      screen: LockUnlockAccountScreen(),
    ),
    _MenuItemData(
      title: "Phân quyền nhân viên",
      icon: Icons.admin_panel_settings,
      screen: StaffPermissionScreen(),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Quản lý người dùng")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView.separated(
          itemCount: _menuItems.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final item = _menuItems[index];
            return Card(
              elevation: 2,
              child: ListTile(
                leading: Icon(item.icon, size: 30),
                title: Text(item.title, style: const TextStyle(fontSize: 16)),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => item.screen),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MenuItemData {
  final String title;
  final IconData icon;
  final Widget screen;
  const _MenuItemData({
    required this.title,
    required this.icon,
    required this.screen,
  });
}
