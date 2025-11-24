import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
// Giả định AuthService đã được định nghĩa và có phương thức login()
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Ẩn/hiện mật khẩu (Đồng bộ với showPassword trong React)
  bool hide = true;
  // Trạng thái tải (Đồng bộ với isLoading trong React)
  bool loading = false;

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  // Giả định đối tượng AuthService đã được khởi tạo
  final AuthService auth = AuthService();

  @override
  void initState() {
    super.initState();
    // Loại bỏ _loadRememberedEmail để đồng bộ với React
  }

  // Hàm hiển thị thông báo (thay thế cho React message/alert)
  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> handleLogin() async {
    // Kiểm tra đầu vào (Việt hóa)
    if (emailController.text.trim().isEmpty || passwordController.text.isEmpty) {
      _showSnackBar('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setState(() => loading = true);

    try {
      final res = await auth.login(
        emailController.text.trim(),
        passwordController.text,
      );

      final prefs = await SharedPreferences.getInstance();

      // === LOGIC ĐỒNG BỘ VỚI REACT (localStorage) ===
      
      // 1. Lưu thông tin xác thực
      await prefs.setString('token', res['token']);
      // Lấy userID: ưu tiên 'id' sau đó là '_id'
      final userId = res['user']['id'] ?? res['user']['_id'];
      await prefs.setString('userID', userId); 
      await prefs.setString('userName', res['user']['name']);
      // Lưu role (important for routing to admin/seller/home)
      if (res['user'] != null && (res['user']['role'] != null)) {
        await prefs.setString('role', res['user']['role']);
      }
      
      // 2. Kiểm tra và tạo giỏ hàng cục bộ nếu chưa có
      if (prefs.getString('localCart') == null) {
        await prefs.setString(
          'localCart',
          '{"items": [], "priceTotal": 0}',
        );
      }
      
      _showSnackBar('Đăng nhập thành công!');

      setState(() => loading = false);

      // 3. Chờ 500ms rồi điều hướng về trang chủ (Đồng bộ với React)
      Future.delayed(const Duration(milliseconds: 500), () {
        // Chuyển hướng về trang gốc '/'
        Navigator.pushReplacementNamed(context, '/'); 
      });
      
    } catch (e) {
      setState(() => loading = false);
      // Thông báo lỗi Việt hóa
      _showSnackBar('Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
      print('Login error: $e');
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Màu nền nhẹ nhàng, tương tự nền xám nhạt trong React
      backgroundColor: Colors.blue.shade50,
      body: Center( 
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 50),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 15,
                  offset: Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  "Đăng nhập",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32, 
                    fontWeight: FontWeight.bold, 
                    color: Color(0xFF00BFFF) // Xanh dương
                  ),
                ),
                const SizedBox(height: 40),
                
                // Email Field (Việt hóa)
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  enabled: !loading,
                  decoration: const InputDecoration(
                    labelText: "Email",
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                    prefixIcon: Icon(Icons.email_outlined, color: Color(0xFF00BFFF)),
                    fillColor: Color(0xFFF5F5F5), // Màu nền nhẹ cho input
                    filled: true,
                  ),
                ),
                const SizedBox(height: 20),
                
                // Password Field (Việt hóa)
                TextField(
                  controller: passwordController,
                  obscureText: hide,
                  enabled: !loading,
                  decoration: InputDecoration(
                    labelText: "Mật khẩu",
                    border: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
                    prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF00BFFF)),
                    fillColor: const Color(0xFFF5F5F5),
                    filled: true,
                    suffixIcon: IconButton(
                      icon: Icon(
                        hide ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey,
                      ),
                      onPressed: loading ? null : () => setState(() => hide = !hide),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                
                // Login Button (Việt hóa)
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00BFFF), // Tương đương sky-600
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 5,
                  ),
                  onPressed: loading ? null : handleLogin,
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
                          "Đăng nhập",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                ),
                
                const SizedBox(height: 20),
                
                // Register link (Việt hóa)
                GestureDetector(
                  onTap: loading ? null : () => Navigator.pushNamed(context, "/register"),
                  child: const Text(
                    "Chưa có tài khoản? Đăng ký ngay!",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF00BFFF),
                      fontWeight: FontWeight.w500,
                      decoration: TextDecoration.underline,
                    ),
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