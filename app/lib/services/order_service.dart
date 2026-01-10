import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/order.dart';
import '../utils/auth_token.dart';

class OrderService {
  final String baseUrl = "http://192.168.2.42:5000/api/orders";

  Future<List<OrderModel>> getTrackingOrders({List<String>? statuses}) async {
    final token = await AuthToken.getToken();
    if (token == null) throw Exception("Token expired");

    statuses ??= ["pending", "confirmed", "processing", "shipped", "delivered"];
    List<OrderModel> result = [];

    for (String st in statuses) {
      try {
        final url = Uri.parse("$baseUrl?status=$st");
        final res = await http.get(
          url,
          headers: {
            "Authorization": "Bearer $token",
            "Content-Type": "application/json",
          },
        );

        if (res.statusCode == 200) {
          final body = jsonDecode(res.body);
          final list = (body["orders"] ?? body["data"] ?? []) as List;
          result.addAll(list.map((e) => _parseOrder(e)));
        }
      } catch (e) {
        print("getTrackingOrders error: $e");
      }
    }

    return result;
  }

  Future<OrderModel> getOrderById(String id) async {
    final token = await AuthToken.getToken();
    if (token == null) throw Exception("Token expired");

    final url = Uri.parse("$baseUrl/$id");
    final res = await http.get(
      url,
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    if (res.statusCode == 200) {
      final body = jsonDecode(res.body);
      return _parseOrder(body["order"] ?? body["data"]);
    }

    throw Exception("Lấy đơn hàng không thành công ${res.statusCode}");
  }

  /// Chuyển shippingAddress từ String sang Map nếu backend trả về String
  OrderModel _parseOrder(Map<String, dynamic> json) {
    var order = OrderModel.fromJson(json);

    if (order.shippingAddress is String) {
      final parts = (order.shippingAddress as String).split(',');
      String fullName = parts.isNotEmpty ? parts[0].split(':').last.trim() : '';
      String phone = parts.length > 1 ? parts[1].split(':').last.trim() : '';
      String address = parts.length > 2 ? parts[2].split(':').last.trim() : '';

      order = OrderModel(
        id: order.id,
        orderCode: order.orderCode,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items,
        shippingAddress: ShippingAddress(fullName: fullName, phone: phone, address: address),
        shippingFee: order.shippingFee,
        notes: order.notes,
      );
    }

    return order;
  }
}
