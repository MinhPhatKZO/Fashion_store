import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/admin_statistics.dart';

class AdminService {
  static const String baseUrl = 'http://localhost:5000/api/admin';

  // Lấy token từ SharedPreferences
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    print('TOKEN = $token'); // Debug token
    return token;
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    // Nếu token null, Flutter Web sẽ không gửi Authorization nhưng server trả 401 → catch
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // 1. Dashboard Statistics
  Future<AdminStatistics> getStatistics() async {
    try {
      final headers = await _getHeaders();
      final response =
          await http.get(Uri.parse('$baseUrl/statistics'), headers: headers);
      print('STATUS: ${response.statusCode}, BODY: ${response.body}');
      if (response.statusCode == 200) {
        return AdminStatistics.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load statistics');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  // 2. Manage Users
  Future<List<UserModel>> getUsers({String? role}) async {
    try {
      final headers = await _getHeaders();
      String url = '$baseUrl/users';
      if (role != null) url += '?role=$role';
      final response = await http.get(Uri.parse(url), headers: headers);
      print('STATUS: ${response.statusCode}, BODY: ${response.body}');
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        return data.map((e) => UserModel.fromJson(e)).toList();
      } else {
        throw Exception('Failed to load users');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  Future<UserModel> updateUserRole(String userId, String newRole) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/users/$userId/role'),
      headers: headers,
      body: jsonEncode({'role': newRole}),
    );
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return UserModel.fromJson(data['user']);
    } else {
      throw Exception('Failed to update user role');
    }
  }

  Future<void> deleteUser(String userId) async {
    final headers = await _getHeaders();
    final response =
        await http.delete(Uri.parse('$baseUrl/users/$userId'), headers: headers);
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode != 200) {
      throw Exception('Failed to delete user');
    }
  }

  // 3. Manage Promotions
  Future<List<PromotionModel>> getPromotions() async {
    final headers = await _getHeaders();
    final response =
        await http.get(Uri.parse('$baseUrl/promotions'), headers: headers);
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => PromotionModel.fromJson(e)).toList();
    } else {
      throw Exception('Failed to load promotions');
    }
  }

  Future<PromotionModel> createPromotion(PromotionModel promotion) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/promotions'),
      headers: headers,
      body: jsonEncode(promotion.toJson()),
    );
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode == 201) {
      return PromotionModel.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create promotion');
    }
  }

  Future<PromotionModel> updatePromotion(String id, PromotionModel promotion) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/promotions/$id'),
      headers: headers,
      body: jsonEncode(promotion.toJson()),
    );
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode == 200) {
      return PromotionModel.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update promotion');
    }
  }

  Future<PromotionModel> togglePromotion(String id) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/promotions/$id/toggle'),
      headers: headers,
    );
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode == 200) {
      return PromotionModel.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to toggle promotion');
    }
  }

  Future<void> deletePromotion(String id) async {
    final headers = await _getHeaders();
    final response =
        await http.delete(Uri.parse('$baseUrl/promotions/$id'), headers: headers);
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode != 200) {
      throw Exception('Failed to delete promotion');
    }
  }

  // 4. Manage Orders
  Future<List<OrderModel>> getOrders() async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/orders'), headers: headers);
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => OrderModel.fromJson(e)).toList();
    } else {
      throw Exception('Failed to load orders');
    }
  }

  Future<OrderModel> updateOrderStatus(String orderId, String status) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/orders/$orderId/status'),
      headers: headers,
      body: jsonEncode({'status': status}),
    );
    print('STATUS: ${response.statusCode}, BODY: ${response.body}');
    if (response.statusCode == 200) {
      return OrderModel.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update order status');
    }
  }
}
