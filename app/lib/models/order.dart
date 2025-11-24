class OrderModel {
  final String id;
  final String orderCode;
  final double totalPrice;
  final String status;
  final DateTime? createdAt;
  final List<OrderItem> items;
  final ShippingAddress? shippingAddress;
  final double shippingFee;
  final String? notes;

  OrderModel({
    required this.id,
    required this.orderCode,
    required this.totalPrice,
    required this.status,
    this.createdAt,
    this.items = const [],
    this.shippingAddress,
    this.shippingFee = 0.0,
    this.notes,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    String parseId(dynamic value) {
      if (value == null) return '';
      if (value is String) return value;
      if (value is Map && value.containsKey(r'$oid')) return value[r'$oid'];
      return value.toString();
    }

    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      if (value is String) return DateTime.tryParse(value);
      if (value is Map && value.containsKey(r'$date')) {
        return DateTime.tryParse(value[r'$date']);
      }
      return null;
    }

    return OrderModel(
      id: parseId(json['_id'] ?? json['id']),
      orderCode: json['orderCode']?.toString() ?? json['orderNumber']?.toString() ?? '',
      totalPrice: _parseDouble(json['totalPrice']),
      status: json['status']?.toString() ?? '',
      createdAt: parseDate(json['createdAt']),
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => OrderItem.fromJson(e))
              .toList() ??
          [],
      shippingAddress: json['shippingAddress'] != null
          ? ShippingAddress.fromJson(json['shippingAddress'])
          : null,
      shippingFee: _parseDouble(json['shippingFee']),
      notes: json['notes']?.toString(),
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}

class OrderItem {
  final String productId;
  final String productName;
  final double price;
  final int quantity;
  final double subtotal;

  OrderItem({
    required this.productId,
    required this.productName,
    required this.price,
    required this.quantity,
    required this.subtotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    String parseId(dynamic value) {
      if (value == null) return '';
      if (value is String) return value;
      if (value is Map && value.containsKey(r'$oid')) return value[r'$oid'];
      return value.toString();
    }

    return OrderItem(
      productId: parseId(json['productId'] ?? json['product']),
      productName: json['productName']?.toString() ?? '',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : 0,
      quantity: json['quantity'] ?? 0,
      subtotal: (json['subtotal'] is num)
          ? (json['subtotal'] as num).toDouble()
          : 0,
    );
  }
}

class ShippingAddress {
  final String fullName;
  final String phone;
  final String address;

  ShippingAddress({
    required this.fullName,
    required this.phone,
    required this.address,
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    return ShippingAddress(
      fullName: json['fullName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
    );
  }
}
