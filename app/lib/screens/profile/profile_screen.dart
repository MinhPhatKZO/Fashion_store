import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

// WEB picker
import 'dart:html' as html;

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
  Uint8List? _webImageBytes; // dùng cho Web
  // Removed _isUploadingImage as it wasn't used to show a loading state in the original build method.

  @override
  void initState() {
    super.initState();
    _loadLocalImage();
  }

  Future<void> _loadLocalImage() async {
    final prefs = await SharedPreferences.getInstance();
    // Use a unique key for the profile image storage
    final savedImage = prefs.getString('profile_image');

    // Only set _localImagePath for non-web platforms as _webImageBytes is used for web
    if (!kIsWeb) {
      if (savedImage != null) {
        // Check if the file still exists before setting the path (optional safety check)
        if (await File(savedImage).exists()) {
          setState(() {
            _localImagePath = savedImage;
          });
        }
      }
    }
    // Note: For web, the image bytes are not persisted with SharedPreferences in this approach,
    // they would typically be re-fetched from a server or re-selected by the user after refresh.
  }

  // PICK IMAGE — MOBILE
  Future<void> _pickImageMobile(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
      );

      if (image != null) {
        // You might want to copy the image to a permanent app directory
        // if you want it to persist even if the picker temporary file is removed.
        // For simplicity, we stick to saving the path here.

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('profile_image', image.path);

        setState(() {
          _localImagePath = image.path;
        });

        if (mounted) {
          Navigator.pop(context); // Close the bottom sheet after selection
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật ảnh đại diện thành công!')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    }
  }

  // PICK IMAGE — WEB
  Future<void> _pickImageWeb() async {
    final html.FileUploadInputElement uploadInput =
        html.FileUploadInputElement()..accept = 'image/*';

    uploadInput.click();

    uploadInput.onChange.listen((event) {
      final file = uploadInput.files?.first;
      if (file == null) return;

      final reader = html.FileReader();

      reader.readAsArrayBuffer(file);

      reader.onLoadEnd.listen((event) async {
        if (mounted) {
          setState(() {
            _webImageBytes = reader.result as Uint8List;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật ảnh đại diện thành công!')),
          );
        }
      });
    });
  }

  void _chooseImage() {
    if (kIsWeb) {
      _pickImageWeb();
    } else {
      _showImageSourceDialog();
    }
  }

  // MOBILE: chọn Camera / Gallery
  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text("Chọn từ thư viện"),
              onTap: () {
                // Navigator.pop(context) is now called inside _pickImageMobile
                _pickImageMobile(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text("Chụp ảnh"),
              onTap: () {
                // Navigator.pop(context) is now called inside _pickImageMobile
                _pickImageMobile(ImageSource.camera);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    // Điều hướng đến màn hình đăng nhập, đảm bảo route '/login' đã được định nghĩa
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  // Widget riêng để tạo các mục menu trong body
  Widget _buildProfileMenuItem({
    required IconData icon,
    required String title,
    VoidCallback? onTap,
    String? badgeText,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 15.0),
        child: Row(
          children: [
            Icon(icon, size: 24, color: Colors.blueGrey),
            const SizedBox(width: 20),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
            ),
            if (badgeText != null)
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: Colors.green.shade400,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  badgeText,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // chọn ảnh hiển thị
    ImageProvider? avatarImage;
    Widget? avatarFallback;

    if (kIsWeb) {
      if (_webImageBytes != null) {
        avatarImage = MemoryImage(_webImageBytes!);
      } else if (widget.imageUrl != null) {
        avatarImage = NetworkImage(widget.imageUrl!);
      }
    } else {
      if (_localImagePath != null) {
        // Use a placeholder/error image if the file doesn't exist
        avatarImage = FileImage(File(_localImagePath!));
      } else if (widget.imageUrl != null) {
        avatarImage = NetworkImage(widget.imageUrl!);
      }
    }

    // Fallback widget for CircleAvatar when no image is available
    if (avatarImage == null) {
      avatarFallback = Text(
        widget.username.isNotEmpty ? widget.username[0].toUpperCase() : "U",
        style: const TextStyle(fontSize: 40, color: Colors.white),
      );
    }

    return Scaffold(
      // AppBar Tùy chỉnh
      appBar: AppBar(
        // Loại bỏ title mặc định, sử dụng PreferredSize cho layout tùy chỉnh
        automaticallyImplyLeading: false, // Loại bỏ nút back mặc định
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF4C86E8), Color(0xFF6A9BFD)], // Màu xanh dương
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Icon(Icons.menu, color: Colors.white), // Menu Icon
                  TextButton(
                    onPressed: _chooseImage,
                    child: const Text(
                      "Edit",
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        toolbarHeight: 56, // Giữ chiều cao tiêu chuẩn
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Profile (Avatar, Tên, Email)
            Container(
              height: 200, // Chiều cao tối ưu cho phần header
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF4C86E8), Color(0xFF6A9BFD)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(0)), // Giữ bo góc nếu cần, ở đây tôi loại bỏ để khớp với AppBar
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 45,
                          backgroundColor: Colors.white, // Vòng ngoài màu trắng
                          child: CircleAvatar(
                            radius: 43,
                            backgroundColor: Colors.blue.shade700,
                            backgroundImage: avatarImage,
                            child: avatarFallback,
                          ),
                        ),
                        // Green Checkmark Icon (Đã xác minh)
                        Positioned(
                          right: 0,
                          child: Container(
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.check_circle,
                              color: Color(0xFF4CD964), // Màu xanh lá cây của checkmark
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      widget.username,
                      style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white),
                    ),
                    Text(
                      widget.email,
                      style: TextStyle(
                          fontSize: 14, color: Colors.white.withOpacity(0.8)),
                    ),
                  ],
                ),
              ),
            ),
            
            // Body - Menu Items
            Container(
              color: const Color(0xFFF7F7F7), // Màu nền nhẹ cho các mục
              child: ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(), // Vô hiệu hóa cuộn bên trong
                children: [
                  // My Profile
                  _buildProfileMenuItem(
                    icon: Icons.person_outline,
                    title: "My Profile",
                    onTap: () {
                      // Xử lý khi nhấn My Profile
                    },
                  ),
                  const Divider(height: 1, indent: 20, endIndent: 20, color: Color(0xFFE0E0E0)),

                  // Messages
                  _buildProfileMenuItem(
                    icon: Icons.email_outlined,
                    title: "Messages",
                    badgeText: "2", // Số lượng tin nhắn chưa đọc
                    onTap: () {
                      // Xử lý khi nhấn Messages
                    },
                  ),
                  const Divider(height: 1, indent: 20, endIndent: 20, color: Color(0xFFE0E0E0)),

                  // Settings
                  _buildProfileMenuItem(
                    icon: Icons.settings_outlined,
                    title: "Settings",
                    onTap: () {
                      // Xử lý khi nhấn Settings
                    },
                  ),
                  const Divider(height: 1, indent: 20, endIndent: 20, color: Color(0xFFE0E0E0)),

                  // Terms & Privacy Policy
                  _buildProfileMenuItem(
                    icon: Icons.verified_user_outlined,
                    title: "Terms & Privacy Policy",
                    onTap: () {
                      // Xử lý khi nhấn Terms & Privacy Policy
                    },
                  ),
                  const Divider(height: 1, indent: 20, endIndent: 20, color: Color(0xFFE0E0E0)),

                  const SizedBox(height: 20),

                  // Logout Button (Layout giống ListTile)
                  InkWell(
                    onTap: _handleLogout,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 15.0),
                      child: Row(
                        children: [
                          Icon(Icons.logout, size: 24, color: Colors.red.shade700),
                          const SizedBox(width: 20),
                          Text(
                            "Logout",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: Colors.red.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}