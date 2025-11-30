class AppImages {
  // --- Placeholder chung ---
  static const String placeholder = 'products/placeholder.png';

  // --- Product images ---
  static String getProductImage(String productId, {String? fallback}) {
    final path = 'products/$productId.jpg';
    return _getPath(path, fallback ?? placeholder);
  }

  // --- Brand logos ---
  static String getBrandLogo(String brandId, {String? fallback}) {
    final path = 'images/brands/$brandId.png';
    return _getPath(path, fallback ?? placeholder);
  }

  // --- Category images ---
  static String getCategoryImage(String categoryId, {String? fallback}) {
    final path = 'images/categories/$categoryId.png';
    return _getPath(path, fallback ?? placeholder);
  }

  // --- Helper ---
  static String _getPath(String path, String? fallback) {
    return path;
  }
}