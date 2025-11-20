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
      success: json['success'] ?? false,
      paymentUrl: json['paymentUrl'] ?? '',
      message: json['message'],
    );
  }
}

class VNPayService {
  // ✅ Thay đổi URL này theo IP máy của bạn hoặc domain
  static const String baseUrl = 'http://localhost:5000/api/vnpay';
  // Nếu test trên thiết bị thật, dùng IP máy: http://192.168.x.x:5000/api/vnpay

  /// Tạo payment URL cho VNPAY
  Future<VNPayPayment?> createPayment({
    required String amount,
    required String orderInfo,
    String? bankCode,
    String language = 'vn',
  }) async {
    try {
      final url = Uri.parse('$baseUrl/create_payment_url');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'amount': amount,
          'orderInfo': orderInfo,
          'bankCode': bankCode,
          'language': language,
        }),
      );

      print('📤 VNPAY Request: ${json.encode({
        'amount': amount,
        'orderInfo': orderInfo,
        'bankCode': bankCode,
        'language': language,
      })}');

      print('📥 VNPAY Response Status: ${response.statusCode}');
      print('📥 VNPAY Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return VNPayPayment.fromJson(data);
      } else {
        print('❌ VNPAY Error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ VNPAY Exception: $e');
      return null;
    }
  }

  /// Verify payment result (optional - nếu cần verify ở app)
  Future<Map<String, dynamic>?> verifyPayment(Map<String, dynamic> params) async {
    try {
      final url = Uri.parse('$baseUrl/vnpay_return');
      final queryParams = params.map((key, value) => MapEntry(key, value.toString()));
      final fullUrl = url.replace(queryParameters: queryParams);

      final response = await http.get(fullUrl);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('❌ VNPAY Verify Exception: $e');
      return null;
    }
  }
}