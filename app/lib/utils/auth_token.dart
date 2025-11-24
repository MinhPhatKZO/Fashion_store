import 'package:shared_preferences/shared_preferences.dart';

class AuthToken {
  // Lấy token từ SharedPreferences
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    // Thử các key thường dùng
    return prefs.getString('token') ?? 
           prefs.getString('auth_token') ?? 
           prefs.getString('access_token');
  }

  // Lưu token
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  // Xóa token
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('auth_token');
    await prefs.remove('access_token');
  }
}