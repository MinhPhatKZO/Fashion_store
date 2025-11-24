import 'package:flutter/material.dart';
import 'admin_users_screen.dart';
import 'admin_promotions_screen.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Admin Dashboard"),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _menuButton(
              context,
              title: "Quản lý người dùng",
              icon: Icons.people,
              screen: const AdminUserScreen(),
              color: Colors.blue,
            ),
            _menuButton(
              context,
              title: "Quản lý khuyến mãi",
              icon: Icons.discount,
              screen: const AdminPromotionScreen(),
              color: Colors.orange,
            ),
          ],
        ),
      ),
    );
  }

  Widget _menuButton(BuildContext context,
      {required String title,
      required IconData icon,
      required Widget screen,
      required Color color}) {
    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        leading: Icon(icon, size: 32, color: color),
        title: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.arrow_forward_ios),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => screen),
        ),
      ),
    );
  }
}
