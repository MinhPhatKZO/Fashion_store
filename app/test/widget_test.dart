// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// 👇 Đã sửa đúng tên package của bạn
import 'package:fashion_store_app/main.dart';

void main() {
  testWidgets('Smoke test for Fashion Store App', (WidgetTester tester) async {
    // 👇 Đã đổi MyApp thành FashionStoreApp
    await tester.pumpWidget(const FashionStoreApp());

    // Vì đây là app bán hàng, không có nút đếm số '+' nên mình thay bằng 
    // lệnh kiểm tra xem app có khởi tạo thành công MaterialApp hay không.
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}