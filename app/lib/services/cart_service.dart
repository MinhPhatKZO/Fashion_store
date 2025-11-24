import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/cart_item.dart';
import '../models/product.dart';

class CartService extends ChangeNotifier {
  CartService._internal();

  static final CartService instance = CartService._internal();

  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  double get subTotal => _items.fold(0.0, (s, it) => s + it.total);

  int get itemCount => _items.fold(0, (s, it) => s + it.quantity);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('cart_items');
    if (raw == null) return;
    try {
      final List<dynamic> decoded = jsonDecode(raw) as List<dynamic>;
      _items.clear();
      for (final e in decoded) {
        if (e is Map<String, dynamic>) {
          _items.add(CartItem.fromJson(e));
        } else if (e is Map) {
          _items.add(CartItem.fromJson(Map<String, dynamic>.from(e)));
        }
      }
      notifyListeners();
    } catch (_) {
      // ignore
    }
  }

  Future<void> persist() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(_items.map((e) => e.toJson()).toList());
    await prefs.setString('cart_items', encoded);
  }

  Future<void> add(
    Product product, {
    Map<String, dynamic>? variant,
    int quantity = 1,
  }) async {
    final idx = _items.indexWhere(
      (it) => it.product.id == product.id && mapEquals(it.variant, variant),
    );
    if (idx >= 0) {
      _items[idx].quantity += quantity;
    } else {
      _items.add(
        CartItem(product: product, variant: variant, quantity: quantity),
      );
    }
    await persist();
    notifyListeners();
  }

  Future<void> updateQuantity(
    Product product,
    int quantity, {
    Map<String, dynamic>? variant,
  }) async {
    final idx = _items.indexWhere(
      (it) => it.product.id == product.id && mapEquals(it.variant, variant),
    );
    if (idx >= 0) {
      _items[idx].quantity = quantity;
      if (_items[idx].quantity <= 0) {
        _items.removeAt(idx);
      }
      await persist();
      notifyListeners();
    }
  }

  Future<void> remove(Product product, {Map<String, dynamic>? variant}) async {
    _items.removeWhere(
      (it) => it.product.id == product.id && mapEquals(it.variant, variant),
    );
    await persist();
    notifyListeners();
  }

  Future<void> clear() async {
    _items.clear();
    await persist();
    notifyListeners();
  }
}
