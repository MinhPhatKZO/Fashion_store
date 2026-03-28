import 'dart:convert';
// Sửa dòng import này để tránh xung đột tên
import 'package:flutter/foundation.dart' hide Category; 
import 'package:http/http.dart' as http;
import '../models/category.dart';

class CategoryService {
  // Tự động chọn IP 10.0.2.2 cho máy ảo Android và localhost cho Web
  static String get baseUrl => kIsWeb ? 'http://localhost:5000' : 'http://10.0.2.2:5000';

  /// Lấy danh sách category
  static Future<List<Category>> getCategories() async {
    final res = await http.get(Uri.parse('$baseUrl/categories'));
    if (res.statusCode == 200) {
      final List data = json.decode(res.body);
      return data.map((c) => Category.fromJson(c)).toList();
    } else {
      throw Exception('Failed to load categories');
    }
  }

  /// Tạo category mới
  static Future<Category> createCategory(String name) async {
    final res = await http.post(
      Uri.parse('$baseUrl/categories'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'name': name}),
    );
    if (res.statusCode == 200) {
      return Category.fromJson(json.decode(res.body));
    } else {
      throw Exception('Failed to create category');
    }
  }

  /// Cập nhật category
  static Future<Category> updateCategory(String id, String name) async {
    final res = await http.put(
      Uri.parse('$baseUrl/categories/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'name': name}),
    );
    if (res.statusCode == 200) {
      return Category.fromJson(json.decode(res.body));
    } else {
      throw Exception('Failed to update category');
    }
  }

  /// Xóa category
  static Future<void> deleteCategory(String id) async {
    final res = await http.delete(Uri.parse('$baseUrl/categories/$id'));
    if (res.statusCode != 200) {
      throw Exception('Failed to delete category');
    }
  }
}