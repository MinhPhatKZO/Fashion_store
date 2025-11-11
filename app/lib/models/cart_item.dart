import 'product.dart';

class CartItem {
  final Product product;
  final Map<String, dynamic>? variant;
  int quantity;

  CartItem({required this.product, this.variant, this.quantity = 1});

  double get unitPrice => product.price;

  double get total => unitPrice * quantity;

  Map<String, dynamic> toJson() => {
    'product': product.toJson(),
    'variant': variant,
    'quantity': quantity,
  };

  static CartItem fromJson(Map<String, dynamic> map) => CartItem(
    product: Product.fromJson(map['product'] as Map<String, dynamic>),
    variant: map['variant'] == null
        ? null
        : Map<String, dynamic>.from(map['variant'] as Map),
    quantity: (map['quantity'] as num?)?.toInt() ?? 1,
  );
}
