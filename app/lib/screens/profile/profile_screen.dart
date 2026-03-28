import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

class ProfileScreen extends StatefulWidget {
  final String username;
  final String email;
  final String? imageUrl;

  const ProfileScreen({
    super.key,
    required this.username,
    required this.email,
    this.imageUrl,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();
  String? _localImagePath;
  Uint8List? _webImageBytes;

  // 👇 Màu sắc thương hiệu KZONE
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneLightBrown = Color(0xFFC4A484);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

  @override
  void initState() {
    super.initState();
    _loadLocalImage();
  }

  Future<void> _loadLocalImage() async {
    final prefs = await SharedPreferences.getInstance();
    final savedImage = prefs.getString('profile_image');

    if (!kIsWeb) {
      if (savedImage != null) {
        if (await File(savedImage).exists()) {
          setState(() {
            _localImagePath = savedImage;
          });
        }
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
      );

      if (image != null) {
        if (kIsWeb) {
          var bytes = await image.readAsBytes();
          setState(() {
            _webImageBytes = bytes;
          });
        } else {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('profile_image', image.path);

          setState(() {
            _localImagePath = image.path;
          });
        }

        if (mounted) {
          Navigator.pop(context); 
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Đã cập nhật ảnh đại diện!'),
              backgroundColor: kzoneBrown,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("CẬP NHẬT ẢNH ĐẠI DIỆN", 
                style: TextStyle(fontWeight: FontWeight.w900, color: kzoneBrown, letterSpacing: 1)),
              const SizedBox(height: 10),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: kzoneBrown),
                title: const Text("Chọn từ thư viện"),
                onTap: () => _pickImage(ImageSource.gallery),
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined, color: kzoneBrown),
                title: const Text("Chụp ảnh mới"),
                onTap: () => _pickImage(ImageSource.camera),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  Widget _buildProfileMenuItem({
    required IconData icon,
    required String title,
    VoidCallback? onTap,
    String? badgeText,
    Color? textColor,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (textColor ?? kzoneBrown).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 22, color: textColor ?? kzoneBrown),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 15, 
          fontWeight: FontWeight.w600,
          color: textColor ?? Colors.black87,
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badgeText != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFA0522D),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                badgeText,
                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          const SizedBox(width: 8),
          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ImageProvider? avatarImage;
    if (kIsWeb && _webImageBytes != null) {
      avatarImage = MemoryImage(_webImageBytes!);
    } else if (_localImagePath != null) {
      avatarImage = FileImage(File(_localImagePath!));
    } else if (widget.imageUrl != null) {
      avatarImage = NetworkImage(widget.imageUrl!);
    }

    return Scaffold(
      backgroundColor: kzoneBeige,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 👇 Header với hiệu ứng dải màu Nâu sang trọng
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            automaticallyImplyLeading: false,
            backgroundColor: kzoneBrown,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [kzoneBrown, kzoneLightBrown],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                          child: CircleAvatar(
                            radius: 45,
                            backgroundColor: kzoneBeige,
                            backgroundImage: avatarImage,
                            child: avatarImage == null 
                              ? Text(widget.username.isNotEmpty ? widget.username[0].toUpperCase() : "U",
                                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: kzoneBrown))
                              : null,
                          ),
                        ),
                        GestureDetector(
                          onTap: _showImageSourceDialog,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(color: Color(0xFFA0522D), shape: BoxShape.circle),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(widget.username, 
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                    Text(widget.email, 
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13)),
                  ],
                ),
              ),
            ),
          ),

          // 👇 Danh sách Menu chức năng
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 20, offset: const Offset(0, 10))
                ],
              ),
              child: Column(
                children: [
                  const SizedBox(height: 10),
                  _buildProfileMenuItem(
                    icon: Icons.person_outline_rounded,
                    title: "Thông tin cá nhân",
                    onTap: () {},
                  ),
                  const Divider(indent: 70, endIndent: 20, height: 1),
                  _buildProfileMenuItem(
                    icon: Icons.shopping_bag_outlined,
                    title: "Đơn hàng của tôi",
                    badgeText: "2",
                    onTap: () {},
                  ),
                  const Divider(indent: 70, endIndent: 20, height: 1),
                  _buildProfileMenuItem(
                    icon: Icons.favorite_border_rounded,
                    title: "Danh sách yêu thích",
                    onTap: () {},
                  ),
                  const Divider(indent: 70, endIndent: 20, height: 1),
                  _buildProfileMenuItem(
                    icon: Icons.settings_outlined,
                    title: "Cài đặt ứng dụng",
                    onTap: () {},
                  ),
                  const Divider(indent: 70, endIndent: 20, height: 1),
                  _buildProfileMenuItem(
                    icon: Icons.verified_user_outlined,
                    title: "Chính sách bảo mật",
                    onTap: () {},
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),

          // 👇 Nút Đăng xuất
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextButton(
                onPressed: _handleLogout,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.logout_rounded, color: Colors.red.shade700, size: 20),
                    const SizedBox(width: 8),
                    Text("Đăng xuất tài khoản", 
                      style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
              ),
            ),
          ),
          const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
        ],
      ),
    );
  }
}