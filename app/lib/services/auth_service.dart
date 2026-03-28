import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AuthService {
  // Tự động chuyển đổi IP: Web dùng localhost, Android Emulator dùng 10.0.2.2
  static String get baseUrl => kIsWeb 
      ? 'http://localhost:5000/api/auth' 
      : 'http://10.0.2.2:5000/api/auth';

  /* ==================================================
     1. ĐĂNG KÝ (USER THƯỜNG)
     -> Đồng bộ với: POST /api/auth/register
  ================================================== */
  Future<Map<String, dynamic>> register(
    String name,
    String email,
    String password, {
    String? phone,
    String? address,
  }) async {
    try {
      final body = {
        'name': name,
        'email': email,
        'password': password,
      };

      if (phone != null) body['phone'] = phone;
      if (address != null) body['address'] = address;

      final response = await http.post(
        Uri.parse('$baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 201) {
        debugPrint('✅ Đăng ký thành công: $email');
        return data; // BE trả về: { message, user: {...} }
      } else {
        // Backend đang dùng express-validator, có thể trả về array errors
        if (data['errors'] != null) {
          throw Exception(data['errors'][0]['msg']); 
        }
        throw Exception(data['message'] ?? 'Đăng ký thất bại');
      }
    } catch (e) {
      debugPrint('❌ Lỗi hệ thống khi đăng ký: $e');
      throw Exception('Kết nối máy chủ thất bại: $e');
    }
  }

  /* ==================================================
     2. ĐĂNG NHẬP (USER & SELLER)
     -> Đồng bộ với: POST /api/auth/login
  ================================================== */
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        debugPrint('✅ Đăng nhập thành công: ${data['user']['name']}');
        return data; // BE trả về: { message, token, user: {...} }
      } else {
        throw Exception(data['message'] ?? 'Tài khoản hoặc mật khẩu không đúng');
      }
    } catch (e) {
      debugPrint('❌ Lỗi kết nối Login: $e');
      throw Exception('Máy chủ không phản hồi');
    }
  }

  /* ==================================================
     3. ĐĂNG NHẬP BẰNG GOOGLE (SOCIAL)
     -> Đồng bộ với: POST /api/auth/google
  ================================================== */
  Future<Map<String, dynamic>> googleLogin(
      String email, String name, String googleId, String picture) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/google'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'name': name,
          'sub': googleId,
          'picture': picture
        }),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        return data;
      } else {
        throw Exception(data['message'] ?? 'Xác thực Google thất bại');
      }
    } catch (e) {
      debugPrint('❌ Lỗi Google Login: $e');
      throw Exception('Kết nối máy chủ thất bại');
    }
  }

  /* ==================================================
     4. QUÊN MẬT KHẨU (GỬI EMAIL)
     -> Đồng bộ với: POST /api/auth/forgot-password
  ================================================== */
  Future<bool> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email}),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        debugPrint('✅ Đã gửi email reset password');
        return true;
      } else {
        throw Exception(data['message'] ?? 'Không thể gửi email');
      }
    } catch (e) {
      debugPrint('❌ Lỗi Forgot Password: $e');
      throw Exception('Máy chủ không phản hồi');
    }
  }

  /* ==================================================
     5. LẤY THÔNG TIN CÁ NHÂN (PROFILE)
     -> Đồng bộ với: GET /api/auth/profile
  ================================================== */
  Future<Map<String, dynamic>> getProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token', // Gửi token lên BE để auth middleware xác nhận
        },
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        return data; // BE trả về: { user: {...}, brand: {...} }
      } else {
        throw Exception(data['message'] ?? 'Không thể lấy thông tin');
      }
    } catch (e) {
      debugPrint('❌ Lỗi getProfile: $e');
      throw Exception('Phiên đăng nhập hết hạn');
    }
  }

  /* ==================================================
     6. CẬP NHẬT THÔNG TIN CÁ NHÂN
     -> Đồng bộ với: PUT /api/auth/profile
  ================================================== */
  Future<Map<String, dynamic>> updateProfile(
    String token, {
    String? name,
    String? phone,
    String? address,
    // (Tuỳ chọn: Nếu bạn có API upload avatar riêng thì không cần update avatar ở đây)
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (phone != null) body['phone'] = phone;
      if (address != null) body['address'] = address;

      final response = await http.put(
        Uri.parse('$baseUrl/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(body),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200) {
        debugPrint('✅ Cập nhật Profile thành công');
        return data; // BE trả về: { message, user: {...} }
      } else {
        throw Exception(data['message'] ?? 'Cập nhật thất bại');
      }
    } catch (e) {
      debugPrint('❌ Lỗi updateProfile: $e');
      throw Exception('Không thể lưu thay đổi');
    }
  }
}