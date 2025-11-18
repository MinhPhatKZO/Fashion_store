import 'package:flutter/material.dart';
import '../../services/admin_service.dart';
import '../../models/admin_statistics.dart';

class StaffPermissionScreen extends StatefulWidget {
  const StaffPermissionScreen({Key? key}) : super(key: key);

  @override
  State<StaffPermissionScreen> createState() => _StaffPermissionScreenState();
}

class _StaffPermissionScreenState extends State<StaffPermissionScreen> {
  final AdminService _service = AdminService();
  bool _loading = false;
  List<UserModel> _users = [];

  // Danh sách role động từ dữ liệu server
  Set<String> _roles = {};

  Future<void> _loadUsers() async {
    setState(() => _loading = true);
    try {
      _users = await _service.getUsers();
      // Lấy tất cả role duy nhất từ users
      _roles = _users.map((u) => u.role).toSet();
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _changeRole(String userId, String newRole) async {
    try {
      await _service.updateUserRole(userId, newRole);
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Role updated')));
      setState(() {
        // Cập nhật role local ngay lập tức
        final user = _users.firstWhere((u) => u.id == userId);
        user.role = newRole;
        // Nếu role mới chưa có trong _roles thì thêm vào
        _roles.add(newRole);
      });
    } catch (e) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Error: $e')));
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
      appBar: AppBar(title: const Text('Phân quyền nhân viên')),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _users.isEmpty
                ? const Center(child: Text('Không có nhân viên nào'))
                : ListView.separated(
                    itemCount: _users.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (context, i) {
                      final u = _users[i];

                      return ListTile(
                        title: Text(u.name),
                        subtitle: Text('${u.email} • role: ${u.role}'),
                        trailing: DropdownButton<String>(
                          value: u.role,
                          items: _roles
                              .map((r) =>
                                  DropdownMenuItem(value: r, child: Text(r)))
                              .toList(),
                          onChanged: (val) {
                            if (val != null && val != u.role) {
                              _changeRole(u.id, val);
                            }
                          },
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
