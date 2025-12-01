import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;

class MoMoPayment {
  final String payUrl;
  final int resultCode;
  final String message;

  MoMoPayment({
    required this.payUrl,
    required this.resultCode,
    required this.message,
  });

  factory MoMoPayment.fromJson(Map<String, dynamic> json) {
    return MoMoPayment(
      payUrl: json["payUrl"] ?? "",
      resultCode: json["resultCode"] ?? -1,
      message: json["message"] ?? "",
    );
  }
}

class MoMoService {
  final String baseUrl = "http://192.168.2.42:5000/api/momo";

  Future<MoMoPayment?> createPayment(String orderId, double amount) async {
    final url = Uri.parse("$baseUrl/payment");

    final body = jsonEncode({
      "orderId": orderId,
      "amount": amount.toInt(), // MoMo yêu cầu số nguyên
      "orderInfo": "Thanh toán đơn hàng $orderId",
      "returnUrl": "http://your-public-url/momo-return", // public URL hoặc ngrok
      "notifyUrl": "http://your-public-url/momo-notify",
    });

    try {
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: body,
      );

      if (response.statusCode == 200) {
        return MoMoPayment.fromJson(jsonDecode(response.body));
      } else {
        print("⚠️ MoMo createPayment failed: ${response.body}");
      }
    } catch (e) {
      print("⚠️ MoMoService error: $e");
    }
    return null;
  }
}

// Flutter Web: sử dụng MoMoService
Future<void> payMoMo(BuildContext context, String orderId, double amount) async {
  final service = MoMoService();
  final payment = await service.createPayment(orderId, amount);

  if (payment != null && payment.payUrl.isNotEmpty) {
    final url = Uri.parse(payment.payUrl);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể mở liên kết MoMo')),
      );
    }
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(payment?.message ?? 'Thanh toán MoMo thất bại')),
    );
  }
}
