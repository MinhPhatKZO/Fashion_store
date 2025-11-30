import 'package:flutter/foundation.dart' show kIsWeb;
import '../assets/images.dart';

class Product {
  final String id;
  final String name;
  final String categoryId;
  final String brandId;
  final double price;
  final double? originalPrice;
  final int stock;
  final List<String> images;
  final String description;
  final bool isActive;
  final bool isFeatured;

  Product({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.brandId,
    required this.price,
    this.originalPrice,
    required this.stock,
    required this.images,
    required this.description,
    this.isActive = true,
    this.isFeatured = false,
  });

  /// Lấy ảnh đầu tiên (primary image)
  String get displayImage {
    if (images.isEmpty) {
      final fallback = AppImages.getProductImage(id, fallback: AppImages.placeholder);
      print('🖼️ Product $name: No images, using fallback: $fallback');
      return fallback;
    }
    
    final result = _buildImageUrl(images.first);
    print('🖼️ Product $name: ${images.first} → $result');
    return result;
  }

  /// Lấy tất cả ảnh đã được build URL
  List<String> get fullImageUrls {
    if (images.isEmpty) {
      return [AppImages.getProductImage(id, fallback: AppImages.placeholder)];
    }
    return images.map((img) => _buildImageUrl(img)).toList();
  }

  /// Tính phần trăm giảm giá
  int? get discountPercent {
    if (originalPrice == null || originalPrice! <= price) return null;
    return (((originalPrice! - price) / originalPrice!) * 100).round();
  }

  /// Kiểm tra có đang sale không
  bool get isOnSale => originalPrice != null && originalPrice! > price;

  /// Kiểm tra còn hàng không
  bool get isInStock => stock > 0;

  /// Lấy brand logo
  String get brandLogo {
    return AppImages.getBrandLogo(brandId, fallback: AppImages.placeholder);
  }

  /// Lấy category image
  String get categoryImage {
    return AppImages.getCategoryImage(
      categoryId,
      fallback: AppImages.placeholder,
    );
  }

  /// Build URL cho ảnh (kết hợp server + local fallback)
  static String _buildImageUrl(String path) {
    if (path.isEmpty) {
      return AppImages.placeholder;
    }

    // Nếu đã là URL đầy đủ (http/https)
    if (path.startsWith('http')) return path;

    // ✅ Xử lý asset path - BỎ HẾT PREFIX "assets/"
    if (path.contains('/products/') || path.startsWith('products/')) {
      // Tìm vị trí của "products/"
      final productsIndex = path.indexOf('products/');
      if (productsIndex != -1) {
        // Cắt từ "products/" trở đi → "products/xxx.jpg"
        return path.substring(productsIndex);
      }
    }

    // Build URL từ server (cho các path từ API như "/uploads/...")
    final base = kIsWeb ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
    return path.startsWith('/') ? '$base$path' : '$base/$path';
  }

  /// Helper: Extract ID từ MongoDB format hoặc String
  static String _extractId(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    if (value is Map) {
      return value['\$oid']?.toString() ?? '';
    }
    return value.toString();
  }

  /// Parse từ JSON
  factory Product.fromJson(Map<String, dynamic> json) {
    List<String> imagesList = [];

    if (json['images'] != null) {
      if (json['images'] is List) {
        imagesList = (json['images'] as List)
            .map((e) {
              String url = '';
              
              if (e is Map && e['url'] != null) {
                url = e['url'].toString();
              } else if (e is String) {
                url = e;
              }

              return url;
            })
            .where((e) => e.isNotEmpty)
            .toList();
      } else if (json['images'] is String && json['images'].isNotEmpty) {
        imagesList = [json['images'] as String];
      }
    }

    if (json['primaryImage'] != null && json['primaryImage'] != '') {
      final primary = json['primaryImage'] as String;
      if (!imagesList.contains(primary)) {
        imagesList.insert(0, primary);
      }
    }

    return Product(
      id: _extractId(json['_id']),
      name: json['name']?.toString() ?? '',
      categoryId: _extractId(json['categoryId']) ?? '',
      brandId: _extractId(json['brandId']) ?? '',
      price: _parseDouble(json['price']),
      originalPrice: json['originalPrice'] != null
          ? _parseDouble(json['originalPrice'])
          : null,
      stock: _parseInt(json['stock']),
      images: imagesList,
      description: json['description']?.toString() ?? '',
      isActive: json['isActive'] ?? true,
      isFeatured: json['isFeatured'] ?? false,
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'categoryId': categoryId,
      'brandId': brandId,
      'price': price,
      'originalPrice': originalPrice,
      'stock': stock,
      'images': images,
      'description': description,
      'isActive': isActive,
      'isFeatured': isFeatured,
    };
  }

  Product copyWith({
    String? id,
    String? name,
    String? categoryId,
    String? brandId,
    double? price,
    double? originalPrice,
    int? stock,
    List<String>? images,
    String? description,
    bool? isActive,
    bool? isFeatured,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      categoryId: categoryId ?? this.categoryId,
      brandId: brandId ?? this.brandId,
      price: price ?? this.price,
      originalPrice: originalPrice ?? this.originalPrice,
      stock: stock ?? this.stock,
      images: images ?? this.images,
      description: description ?? this.description,
      isActive: isActive ?? this.isActive,
      isFeatured: isFeatured ?? this.isFeatured,
    );
  }

  @override
  String toString() {
    return 'Product(id: $id, name: $name, price: $price, stock: $stock)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Product && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}