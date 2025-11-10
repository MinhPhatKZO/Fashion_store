import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

import '../models/product.dart';
import '../assets/images.dart';

class ProductService {
  // Tự động chọn baseUrl cho Web hoặc Mobile.
  // For web, build host dynamically from the current page host so the dev web server
  // can access the backend running on the same machine (works if backend is bound to 0.0.0.0).
  static String get _webUrl {
    try {
      final host = Uri.base.host; // picks up current page host or IP
      return 'http://$host:5000';
    } catch (_) {
      return 'http://localhost:5000';
    }
  }

  static const String _mobileUrl = 'http://10.0.2.2:5000';
  static String get baseUrl => kIsWeb ? _webUrl : _mobileUrl;

  /// Lấy danh sách sản phẩm (mặc định 10 sản phẩm)
  Future<List<Product>> getAllProducts({int limit = 10}) async {
    final url = Uri.parse('$baseUrl/api/products?limit=$limit');

    try {
      print('🌐 Fetching products from: $url');
      final response = await http.get(url);

      print('📦 Response status: ${response.statusCode}');

      if (response.statusCode != 200) {
        print('❌ Response body: ${response.body}');
        throw Exception(
          'Failed to load products (status: ${response.statusCode})',
        );
      }

      print(
        '📄 Response body preview: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}...',
      );

      final data = json.decode(response.body);

      // Support multiple response shapes:
      // 1) { products: [...] }
      // 2) { data: [...] }
      // 3) [...] (array directly)
      List productsList = [];
      if (data is List) {
        productsList = data;
      } else if (data is Map) {
        if (data['products'] is List) {
          productsList = data['products'];
        } else if (data['data'] is List) {
          productsList = data['data'];
        } else if (data['results'] is List) {
          productsList = data['results'];
        }
      }

      if (productsList.isEmpty) {
        print(
          '⚠️ Unexpected/empty products payload. Data type: ${data.runtimeType}',
        );
        print('⚠️ Data preview keys: ${data is Map ? data.keys : "N/A"}');
        // Fall back: try to treat the whole body as a single product map
        if (data is Map) {
          productsList = [data];
        }
      }
      print('✅ Successfully loaded ${productsList.length} products');

      // Parse từng product
      final products = <Product>[];
      for (int i = 0; i < productsList.length; i++) {
        try {
          final product = Product.fromJson(productsList[i]);
          products.add(product);
          print(
            '✓ Product $i: ${product.name} - Image: ${product.displayImage}',
          );
        } catch (e) {
          print('❌ Error parsing product $i: $e');
          print('📄 Product data: ${productsList[i]}');
        }
      }

      return products;
    } catch (e, stackTrace) {
      print('❌ Error fetching products: $e');
      print('📚 Stack trace: $stackTrace');
      rethrow;
    }
  }

  /// Lấy sản phẩm theo ID
  Future<Product> getProductById(String id) async {
    final url = Uri.parse('$baseUrl/api/products/$id');

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw Exception(
          'Failed to load product (status: ${response.statusCode})',
        );
      }

      final data = json.decode(response.body);
      return Product.fromJson(data);
    } catch (e) {
      print('❌ Error fetching product: $e');
      rethrow;
    }
  }

  /// Lấy sản phẩm nổi bật
  Future<List<Product>> getFeaturedProducts({int limit = 10}) async {
    final url = Uri.parse('$baseUrl/api/products/featured?limit=$limit');

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw Exception('Failed to load featured products');
      }

      final data = json.decode(response.body);
      final List productsList = data['products'] ?? data;
      return productsList.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      print('❌ Error fetching featured products: $e');
      rethrow;
    }
  }

  /// Lấy sản phẩm theo category
  Future<List<Product>> getProductsByCategory(
    String categoryId, {
    int limit = 20,
  }) async {
    final url = Uri.parse(
      '$baseUrl/api/products/category/$categoryId?limit=$limit',
    );

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw Exception('Failed to load products by category');
      }

      final data = json.decode(response.body);
      final List productsList = data['products'] ?? data;
      return productsList.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      print('❌ Error fetching products by category: $e');
      rethrow;
    }
  }

  /// Lấy sản phẩm theo brand
  Future<List<Product>> getProductsByBrand(
    String brandId, {
    int limit = 20,
  }) async {
    final url = Uri.parse('$baseUrl/api/products/brand/$brandId?limit=$limit');

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw Exception('Failed to load products by brand');
      }

      final data = json.decode(response.body);
      final List productsList = data['products'] ?? data;
      return productsList.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      print('❌ Error fetching products by brand: $e');
      rethrow;
    }
  }

  /// Tìm kiếm sản phẩm
  Future<List<Product>> searchProducts(String query, {int limit = 20}) async {
    final url = Uri.parse('$baseUrl/api/products/search?q=$query&limit=$limit');

    try {
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw Exception('Failed to search products');
      }

      final data = json.decode(response.body);
      final List productsList = data['products'] ?? data;
      return productsList.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      print('❌ Error searching products: $e');
      rethrow;
    }
  }

  /// Xây dựng URL ảnh từ server
  static String buildImageUrl(String path) {
    if (path.isEmpty) return '';
    final host = kIsWeb ? _webUrl : _mobileUrl;

    // Nếu đã là URL đầy đủ
    if (path.startsWith('http')) return path;

    // Xử lý path từ server
    return path.startsWith('/') ? '$host$path' : '$host/$path';
  }

  /// Lấy ảnh local từ assets nếu server fail
  static String getLocalImageFallback(String productId) {
    return AppImages.getProductImage(
      productId,
      fallback: AppImages.placeholder,
    );
  }

  /// Kết hợp: Ưu tiên server, fallback local assets
  static String getProductImage(String productId, String? serverPath) {
    // Nếu có ảnh từ server và valid
    if (serverPath != null && serverPath.isNotEmpty) {
      return buildImageUrl(serverPath);
    }

    // Fallback về local assets
    return getLocalImageFallback(productId);
  }
}
