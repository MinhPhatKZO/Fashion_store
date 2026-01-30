import 'package:flutter/material.dart';
import '../../models/admin_statistics.dart';
import 'combo_management_screen.dart';

class AdminPromotionScreen extends StatelessWidget {
  const AdminPromotionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Quản lý khuyến mãi")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              elevation: 3,
              child: ListTile(
                leading: const Icon(Icons.local_offer, size: 30),
                title: const Text("Quản lý Combo ưu đãi"),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ComboManagementScreen()),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
