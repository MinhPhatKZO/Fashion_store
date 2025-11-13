import 'package:flutter/material.dart';
import '../../services/auth_service.dart';

// Giả định AuthService có phương thức register tương ứng:
// Future<Map<String, dynamic>> register(String name, String email, String password, {String? phone, String? address});

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Đồng bộ với React: showPassword
  bool hide = true;
  // Đồng bộ với React: isLoading
  bool loading = false; 

  // Đồng bộ với React: form state
  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController addressController = TextEditingController();

  final AuthService auth = AuthService();
  
  // Màu chủ đạo (Indigo-600)
  final Color primaryColor = const Color(0xFF4F46E5);

  // === Đồng bộ Notification Component (Sử dụng SnackBar trong Flutter) ===
  void _showSnackBar(String message, {bool isError = true}) {
    // Đóng SnackBar cũ nếu có
    ScaffoldMessenger.of(context).hideCurrentSnackBar(); 
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.cancel_outlined : Icons.check_circle_outline,
              color: Colors.white,
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: isError ? Colors.red.shade600 : Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(10),
      ),
    );
  }

  // === Đồng bộ handleRegister (với logic async/await và thông báo) ===
  void handleRegister() async {
    // 1. Validation (Đồng bộ với React's required fields)
    if (nameController.text.trim().isEmpty ||
        emailController.text.trim().isEmpty ||
        passwordController.text.trim().isEmpty) {
      _showSnackBar("Vui lòng điền đầy đủ các trường bắt buộc (Tên, Email, Mật khẩu).", isError: true);
      return;
    }

    setState(() => loading = true);

    try {
      // Giả định AuthService.register được cập nhật để nhận tất cả các trường
      await auth.register(
        nameController.text.trim(),
        emailController.text.trim(),
        passwordController.text.trim(),
        phone: phoneController.text.trim(),
        address: addressController.text.trim(),
      );

      setState(() => loading = false);
      
      // 2. Success flow (Đồng bộ thông báo và độ trễ 1.5s)
      _showSnackBar("Đăng ký thành công! Đang chuyển hướng...", isError: false);
      
      Future.delayed(const Duration(milliseconds: 1500), () {
        // Mô phỏng navigateToLogin
        Navigator.pushReplacementNamed(context, '/login'); 
      });

    } catch (e) {
      setState(() => loading = false);
      // 3. Error handling (Đồng bộ thông báo lỗi tiếng Việt)
      String errorMessage;
      if (e.toString().contains('409') || e.toString().contains('Email')) {
        errorMessage = "Email đã được sử dụng hoặc lỗi máy chủ (500).";
      } else {
        errorMessage = "Đăng ký thất bại do lỗi không xác định.";
      }
      _showSnackBar(errorMessage, isError: true);
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    phoneController.dispose();
    addressController.dispose();
    super.dispose();
  }

  // Component phụ: InputField (Styled Input with Icon)
  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isPassword = false,
    TextInputType keyboardType = TextInputType.text,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20.0),
      child: TextField(
        controller: controller,
        obscureText: isPassword ? hide : false,
        enabled: !loading,
        keyboardType: keyboardType,
        style: TextStyle(color: Colors.grey.shade800),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.indigo.shade500),
          prefixIcon: Icon(icon, color: primaryColor, size: 20),
          suffixIcon: trailing,
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.indigo.shade200, width: 1),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.indigo.shade200, width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: primaryColor, width: 2),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.indigo.shade50, // Đồng bộ với bg-indigo-50
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 40),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 500),
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24), // Đồng bộ với rounded-3xl
              boxShadow: [
                BoxShadow(
                  color: Colors.indigo.shade100,
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header (Đồng bộ văn bản tiếng Việt)
                Text(
                  "Tham Gia Cộng Đồng",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: Colors.indigo.shade900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  "Tạo tài khoản mới chỉ trong vài giây.",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.indigo.shade500,
                    fontWeight: FontWeight.w300,
                  ),
                ),
                const SizedBox(height: 35),
                
                // === Form Fields ===
                _buildInputField(
                  controller: nameController,
                  label: "Họ và tên đầy đủ",
                  icon: Icons.person_outline,
                ),
                _buildInputField(
                  controller: emailController,
                  label: "Địa chỉ email hợp lệ",
                  icon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                ),
                _buildInputField(
                  controller: passwordController,
                  label: "Mật khẩu (tối thiểu 8 ký tự)",
                  icon: Icons.lock_outline,
                  isPassword: true,
                  trailing: IconButton(
                    icon: Icon(hide ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: primaryColor),
                    onPressed: loading ? null : () => setState(() => hide = !hide),
                  ),
                ),
                _buildInputField(
                  controller: phoneController,
                  label: "Số điện thoại",
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                _buildInputField(
                  controller: addressController,
                  label: "Địa chỉ (ví dụ: TPHCM, Việt Nam)",
                  icon: Icons.location_on_outlined,
                ),
                
                const SizedBox(height: 20),
                
                // Register Button (Đồng bộ style và trạng thái loading)
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 8,
                    shadowColor: primaryColor.withOpacity(0.5),
                  ),
                  onPressed: loading ? null : handleRegister,
                  child: loading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          "Đăng Ký",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                ),
                
                // Footer Navigation (Đồng bộ văn bản)
                const SizedBox(height: 25),
                GestureDetector(
                  onTap: loading ? null : () => Navigator.pushReplacementNamed(context, '/login'),
                  child: Text.rich(
                    TextSpan(
                      text: "Đã có tài khoản? ",
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 15),
                      children: [
                        TextSpan(
                          text: "Đăng nhập ngay",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: primaryColor,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}