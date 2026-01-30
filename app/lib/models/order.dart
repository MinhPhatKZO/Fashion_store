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
  ShippingAddress? address;
  final rawAddress = json['shippingAddress'];
  if (rawAddress != null) {
    if (rawAddress is String) {
      final parts = rawAddress.split(',');
      String fullName = parts.isNotEmpty ? parts[0].split(':').last.trim() : '';
      String phone = parts.length > 1 ? parts[1].split(':').last.trim() : '';
      String addr = parts.length > 2 ? parts[2].split(':').last.trim() : '';
      address = ShippingAddress(
        fullName: fullName,
        phone: phone,
        address: addr,
      );
    } else if (rawAddress is Map) {
      address = ShippingAddress.fromJson(Map<String, dynamic>.from(rawAddress));
    }
  }

  return OrderModel(
    id: _parseId(json['_id'] ?? json['id']),
    orderCode: (json['orderCode'] ?? json['orderNumber'] ?? '').toString(),
    totalPrice: _parseDouble(json['totalPrice']),
    status: (json['status'] ?? '').toString(),
    createdAt: _parseDate(json['createdAt']),
    items: ((json['items'] ?? json['orderItems'] ?? []) as List)
        .map((e) => OrderItem.fromJson(e))
        .toList(),
    shippingAddress: address,
    shippingFee: _parseDouble(json['shippingFee']),
    notes: json['notes']?.toString(),
  );
}

  static String _parseId(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    if (value is Map && value.containsKey(r'$oid')) return value[r'$oid'];
    return value.toString();
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is String) return DateTime.tryParse(value);
    if (value is Map && value.containsKey(r'$date')) {
      return DateTime.tryParse(value[r'$date']);
    }
    return null;
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
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

  factory OrderItem.fromJson(dynamic json) {
    // Nếu BE trả về String thay vì Map, tạo tạm item
    if (json is String) {
      return OrderItem(
        productId: '',
        productName: json,
        price: 0.0,
        quantity: 1,
        subtotal: 0.0,
      );
    }

    final map = json as Map<String, dynamic>;
    final product = map['product'] ?? {};
    final price = _parseDouble(map['price'] ?? product['price']);
    final qty = map['quantity'] ?? 0;

    return OrderItem(
      productId: _parseId(map['productId'] ?? product['_id']),
      productName: (map['productName'] ?? product['name'] ?? '').toString(),
      price: price,
      quantity: qty,
      subtotal: _parseDouble(map['subtotal']) != 0
          ? _parseDouble(map['subtotal'])
          : price * qty,
    );
  }

  static String _parseId(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    if (value is Map && value.containsKey(r'$oid')) return value[r'$oid'];
    return value.toString();
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
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
