// lib/models/admin_statistics.dart
class AdminStatistics {
  final int totalUsers;
  final int totalSellers;
  final int totalProducts;
  final int totalOrders;
  final double totalRevenue;

  AdminStatistics({
    required this.totalUsers,
    required this.totalSellers,
    required this.totalProducts,
    required this.totalOrders,
    required this.totalRevenue,
  });

  factory AdminStatistics.fromJson(Map<String, dynamic> json) {
    return AdminStatistics(
      totalUsers: json['totalUsers'] ?? 0,
      totalSellers: json['totalSellers'] ?? 0,
      totalProducts: json['totalProducts'] ?? 0,
      totalOrders: json['totalOrders'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
    );
  }
}

// lib/models/user_model.dart
class UserModel {
  final String id;
  final String name;
  final String email;
  String role; // <-- sửa từ final sang non-final để có thể cập nhật
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

// lib/models/promotion_model.dart
class PromotionModel {
  final String id;
  final String code;
  final String? description;
  final double discountPercent;
  final DateTime startDate;
  final DateTime endDate;
  final bool active;
  final DateTime? createdAt;

  PromotionModel({
    required this.id,
    required this.code,
    this.description,
    required this.discountPercent,
    required this.startDate,
    required this.endDate,
    required this.active,
    this.createdAt,
  });

  factory PromotionModel.fromJson(Map<String, dynamic> json) {
    return PromotionModel(
      id: json['_id'] ?? json['id'] ?? '',
      code: json['code'] ?? '',
      description: json['description'],
      discountPercent: (json['discountPercent'] ?? 0).toDouble(),
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      active: json['active'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'code': code,
      'description': description,
      'discountPercent': discountPercent,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'active': active,
    };
  }
}

// lib/models/order_model.dart
class OrderModel {
  final String id;
  final UserModel? user;
  final List<OrderItem> items;
  final double totalPrice;
  final String status;
  final DateTime createdAt;

  OrderModel({
    required this.id,
    this.user,
    required this.items,
    required this.totalPrice,
    required this.status,
    required this.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['_id'] ?? json['id'] ?? '',
      user: json['user'] != null ? UserModel.fromJson(json['user']) : null,
      items: (json['items'] as List?)
          ?.map((item) => OrderItem.fromJson(item))
          .toList() ?? [],
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class OrderItem {
  final String productId;
  final String productName;
  final int quantity;
  final double price;

  OrderItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: json['productId'] ?? json['product'] ?? '',
      productName: json['productName'] ?? json['name'] ?? '',
      quantity: json['quantity'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
    );
  }
}

// lib/models/seller_revenue.dart
class SellerRevenue {
  final String sellerId;
  final String sellerName;
  final String sellerEmail;
  final double totalRevenue;
  final int totalOrders;
  final int? year;
  final int? month;

  SellerRevenue({
    required this.sellerId,
    required this.sellerName,
    required this.sellerEmail,
    required this.totalRevenue,
    required this.totalOrders,
    this.year,
    this.month,
  });

  factory SellerRevenue.fromJson(Map<String, dynamic> json) {
    return SellerRevenue(
      sellerId: json['sellerId'] ?? '',
      sellerName: json['sellerName'] ?? '',
      sellerEmail: json['sellerEmail'] ?? '',
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
      totalOrders: json['totalOrders'] ?? 0,
      year: json['year'],
      month: json['month'],
    );
  }
}
