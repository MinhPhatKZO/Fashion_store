import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/order.dart';
import '../utils/auth_token.dart';

class OrderService {
  final String baseUrl = "http://192.168.2.42:5000/api/orders";

  Future<List<OrderModel>> getTrackingOrders({List<String>? statuses}) async {
    final token = await AuthToken.getToken();
    if (token == null || token.isEmpty) {
      throw Exception('Chưa đăng nhập. Vui lòng đăng nhập lại.');
    }

    statuses ??= ["pending", "unconfirmed", "processing", "shipped", "delivered"];
    List<OrderModel> result = [];

    for (String st in statuses) {
      try {
        final uri = Uri.parse("$baseUrl?status=$st");
        final res = await http.get(
          uri,
          headers: {
            "Authorization": "Bearer $token",
            "Content-Type": "application/json",
          },
        ).timeout(
          const Duration(seconds: 10),
          onTimeout: () => throw Exception('Timeout: Không thể kết nối đến server'),
        );

        if (res.statusCode == 200) {
          final body = jsonDecode(res.body);
          List list = [];
          if (body is Map<String, dynamic>) {
            list = body['orders'] ?? body['data'] ?? body['results'] ?? [];
          } else if (body is List) {
            list = body;
          }
          result.addAll(list.map((e) => OrderModel.fromJson(e)));
        }
      } catch (e) {
        print('⚠️ Lỗi khi lấy orders với status $st: $e');
      }
    }

    return result;
  }

  Future<OrderModel> getOrderById(String orderId) async {
    final token = await AuthToken.getToken();
    if (token == null || token.isEmpty) {
      throw Exception('Chưa đăng nhập. Vui lòng đăng nhập lại.');
    }

    final uri = Uri.parse("$baseUrl/$orderId");
    final res = await http.get(
      uri,
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    ).timeout(
      const Duration(seconds: 10),
      onTimeout: () => throw Exception('Timeout: Không thể kết nối đến server'),
    );

    if (res.statusCode == 200) {
      final body = jsonDecode(res.body);
      final orderData = (body as Map<String, dynamic>)['order'] ?? body['data'] ?? body;
      return OrderModel.fromJson(orderData);
    } else {
      throw Exception('Lỗi tải chi tiết đơn hàng: ${res.statusCode}');
    }
  }
}
