import 'dart:convert';
import 'package:http/http.dart' as http;

class VNPayPayment {
  final bool success;
  final String paymentUrl;
  final String? message;

  VNPayPayment({
    required this.success,
    required this.paymentUrl,
    this.message,
  });

  factory VNPayPayment.fromJson(Map<String, dynamic> json) {
    return VNPayPayment(
      success: json["success"] ?? false,
      paymentUrl: json["paymentUrl"] ?? "",
      message: json["message"],
    );
  }
}

class VNPayService {
  final String baseUrl = "http://192.168.2.42:5000/api/vnpay";

  Future<VNPayPayment?> createPayment(String orderId, double amount) async {
    final url = Uri.parse("$baseUrl/create_payment_url");

    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "orderId": orderId,
        "amount": amount,
      }),
    );

    if (response.statusCode == 200) {
      return VNPayPayment.fromJson(jsonDecode(response.body));
    }

    return null;
  }
}
