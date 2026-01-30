import 'package:flutter/material.dart';
import '../../services/admin_service.dart';
import '../../models/admin_statistics.dart';

class ComboManagementScreen extends StatefulWidget {
  const ComboManagementScreen({super.key});

  @override
  State<ComboManagementScreen> createState() => _ComboManagementScreenState();
}

class _ComboManagementScreenState extends State<ComboManagementScreen> {
  final AdminService _service = AdminService();
  bool _loading = false;
  List<PromotionModel> _promos = [];

  Future<void> _loadPromos() async {
    setState(() => _loading = true);
    try {
      _promos = await _service.getPromotions();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _togglePromo(String id) async {
    try {
      await _service.togglePromotion(id);
      await _loadPromos();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _deletePromo(String id) async {
    try {
      await _service.deletePromotion(id);
      await _loadPromos();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  void initState() {
    super.initState();
    _loadPromos();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý Combo ưu đãi'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // open create dialog (simplified)
              showDialog(
                context: context,
                builder: (_) => const AlertDialog(
                  title: Text('Tạo combo (implement API)'),
                  content: Text('Form to create promo should be here.'),
                ),
              );
            },
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _promos.isEmpty
                ? const Center(child: Text('Không có khuyến mãi'))
                : ListView.separated(
                    itemCount: _promos.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (context, i) {
                      final p = _promos[i];
                      return ListTile(
                        title: Text(p.code),
                        subtitle: Text(p.description ?? ''),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(p.active ? Icons.toggle_on : Icons.toggle_off, color: p.active ? Colors.green : Colors.grey),
                              onPressed: () => _togglePromo(p.id),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.redAccent),
                              onPressed: () => _deletePromo(p.id),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
