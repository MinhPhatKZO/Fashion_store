import 'package:flutter/material.dart';
import '../../services/admin_service.dart';
import '../../models/admin_statistics.dart';

class ViewPurchaseHistoryScreen extends StatefulWidget {
  const ViewPurchaseHistoryScreen({Key? key}) : super(key: key);

  @override
  State<ViewPurchaseHistoryScreen> createState() => _ViewPurchaseHistoryScreenState();
}

class _ViewPurchaseHistoryScreenState extends State<ViewPurchaseHistoryScreen> {
  final AdminService _service = AdminService();
  final TextEditingController _searchController = TextEditingController();
  bool _loading = false;
  List<OrderModel> _orders = [];

  Future<void> _loadOrders({String? query}) async {
    setState(() => _loading = true);
    try {
      final all = await _service.getOrders();
      if (query == null || query.isEmpty) {
        _orders = all;
      } else {
        _orders = all.where((o) {
          final email = o.user?.email ?? '';
          final id = o.user?.id ?? '';
          return email.contains(query) || id.contains(query);
        }).toList();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Xem lịch sử mua hàng KH')),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(hintText: 'Tìm theo email hoặc user id'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _loadOrders(query: _searchController.text.trim()),
                  child: const Text('Tìm'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_loading) const Center(child: CircularProgressIndicator()),
            if (!_loading)
              Expanded(
                child: _orders.isEmpty
                    ? const Center(child: Text('Không có đơn hàng'))
                    : ListView.separated(
                        itemCount: _orders.length,
                        separatorBuilder: (_, __) => const Divider(),
                        itemBuilder: (context, i) {
                          final o = _orders[i];
                          return ListTile(
                            title: Text('Đơn ${o.id} — ${o.user?.email ?? 'khách'}'),
                            subtitle: Text('Tổng: \$${o.totalPrice.toStringAsFixed(2)} — Trạng thái: ${o.status}'),
                            onTap: () {
                              showDialog(
                                context: context,
                                builder: (_) => AlertDialog(
                                  title: Text('Chi tiết đơn ${o.id}'),
                                  content: SizedBox(
                                    width: double.maxFinite,
                                    child: ListView(
                                      shrinkWrap: true,
                                      children: o.items
                                          .map((it) => ListTile(
                                                title: Text(it.productName),
                                                trailing: Text('x${it.quantity} — \$${it.price}'),
                                              ))
                                          .toList(),
                                    ),
                                  ),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')),
                                  ],
                                ),
                              );
                            },
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
