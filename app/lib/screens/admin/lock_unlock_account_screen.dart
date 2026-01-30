import 'package:flutter/material.dart';
import '../../services/admin_service.dart';
import '../../models/admin_statistics.dart';

class LockUnlockAccountScreen extends StatefulWidget {
  const LockUnlockAccountScreen({super.key});

  @override
  State<LockUnlockAccountScreen> createState() => _LockUnlockAccountScreenState();
}

class _LockUnlockAccountScreenState extends State<LockUnlockAccountScreen> {
  final AdminService _service = AdminService();
  bool _loading = false;
  List<UserModel> _users = [];

  Future<void> _loadUsers() async {
    setState(() => _loading = true);
    try {
      _users = await _service.getUsers();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteUser(String id) async {
    try {
      await _service.deleteUser(id);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User deleted')));
      await _loadUsers();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Khóa / Mở tài khoản')),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _users.isEmpty
                ? const Center(child: Text('Không có người dùng'))
                : ListView.separated(
                    itemCount: _users.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (context, i) {
                      final u = _users[i];
                      return ListTile(
                        title: Text(u.name),
                        subtitle: Text(u.email),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.lock_open, color: Colors.green),
                              onPressed: () {
                                // Placeholder: implement lock/unlock API in backend
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unlock action (TODO)')));
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.lock, color: Colors.orange),
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lock action (TODO)')));
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.redAccent),
                              onPressed: () => showDialog(
                                context: context,
                                builder: (_) => AlertDialog(
                                  title: const Text('Xác nhận'),
                                  content: const Text('Bạn có chắc muốn xóa tài khoản này không?'),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
                                    TextButton(
                                        onPressed: () {
                                          Navigator.pop(context);
                                          _deleteUser(u.id);
                                        },
                                        child: const Text('Xóa')),
                                  ],
                                ),
                              ),
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
