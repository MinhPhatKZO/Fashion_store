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
      message: json["message"] ?? "Thành công",
    );
  }
}

class MoMoService {
  // 👇 CHỈ DÙNG IP NÀY CHO MÁY ẢO: 10.0.2.2 trỏ thẳng vào localhost máy tính
  // Đường dẫn phải khớp với app.use('/api/momo', ...) ở Backend
  final String baseUrl = "http://10.0.2.2:5000/api/momo/payment"; 

  Future<MoMoPayment?> createPayment(String orderId, double amount) async {
    final url = Uri.parse(baseUrl); 

    final body = jsonEncode({
      "orderId": orderId,
      "amount": amount.toInt(),
      "orderInfo": "Thanh toán đơn hàng KZONE #$orderId",
      // Chỗ này MoMo sẽ gọi về sau khi thanh toán xong
      "redirectUrl": "http://10.0.2.2:5000/api/momo/callback", 
      "ipnUrl": "http://10.0.2.2:5000/api/momo/ipn",
    });

    try {
      debugPrint("🚀 Đang gọi MoMo tại: $baseUrl");
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: body,
      ).timeout(const Duration(seconds: 15)); 

      debugPrint("📥 MoMo Response: ${response.body}"); 

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        // Kiểm tra đúng theo cấu trúc MoMo trả về (resultCode 0 là thành công)
        if (data['resultCode'] == 0 || data['payUrl'] != null) {
           return MoMoPayment.fromJson(data);
        } else {
           return MoMoPayment(
             payUrl: "", 
             resultCode: data['resultCode'] ?? -1, 
             message: data['message'] ?? "Lỗi từ phía MoMo"
           );
        }
      }
    } catch (e) {
      debugPrint("❌ Lỗi kết nối MoMo: $e");
    }
    return null;
  }
}

Future<void> payMoMo(BuildContext context, String orderId, double amount) async {
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => const Center(child: CircularProgressIndicator(color: Colors.pink)),
  );

  final service = MoMoService();
  final payment = await service.createPayment(orderId, amount);

  if (!context.mounted) return;
  Navigator.pop(context); // Tắt vòng xoay loading

  if (payment != null && payment.payUrl.isNotEmpty) {
    final url = Uri.parse(payment.payUrl);
    
    try {
      // Dùng mode: LaunchMode.externalApplication để mở trình duyệt/app MoMo
      bool launched = await launchUrl(url, mode: LaunchMode.externalApplication);
      if (!launched) {
        // Nếu không mở được app, thử mở bằng trình duyệt mặc định
        await launchUrl(url, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      if (!context.mounted) return; 
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể mở trang thanh toán, vui lòng thử lại')),
      );
    }
  } else {
    if (!context.mounted) return; 
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(payment?.message ?? 'Không thể kết nối đến máy chủ thanh toán')),
    );
  }
}