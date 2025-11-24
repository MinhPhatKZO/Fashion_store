import 'dart:convert';
import 'package:http/http.dart' as http;

class MoMoPayment {
  final String partnerCode;
  final String orderId;
  final String requestId;
  final int amount;
  final String message;
  final int resultCode;
  final String payUrl;

  MoMoPayment({
    required this.partnerCode,
    required this.orderId,
    required this.requestId,
    required this.amount,
    required this.message,
    required this.resultCode,
    required this.payUrl,
  });

  factory MoMoPayment.fromJson(Map<String, dynamic> json) {
    return MoMoPayment(
      partnerCode: json['partnerCode'] ?? '',
      orderId: json['orderId'] ?? '',
      requestId: json['requestId'] ?? '',
      amount: int.tryParse(json['amount'].toString()) ?? 0,
      message: json['message'] ?? '',
      resultCode: json['resultCode'] ?? -1,
      payUrl: json['payUrl'] ?? '',
    );
  }
}

class MoMoService {
  // URL backend Node.js
  final String _baseUrl = 'http://localhost:5000/api/momo';

  Future<MoMoPayment?> createPayment({
    required String amount,
    required String orderInfo,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/payment'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'amount': amount,
          'orderInfo': orderInfo,
        }),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        return MoMoPayment.fromJson(json);
      } else {
        print('MoMoService error: ${response.statusCode} ${response.body}');
        return null;
      }
    } catch (e) {
      print('MoMoService exception: $e');
      return null;
    }
  }
}
