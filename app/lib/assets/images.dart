class AppImages {
  // --- Placeholder chung ---
  static const String placeholder = 'assets/images/placeholder.png';

  // --- Product images ---
  static String getProductImage(String productId, {String? fallback}) {
    final path = 'assets/images/products/$productId.jpg';
    return _getPath(path, fallback);
  }

  // --- Brand logos ---
  static String getBrandLogo(String brandId, {String? fallback}) {
    final path = 'assets/images/brands/$brandId.png';
    return _getPath(path, fallback);
  }

  // --- Category images ---
  static String getCategoryImage(String categoryId, {String? fallback}) {
    final path = 'assets/images/categories/$categoryId.png';
    return _getPath(path, fallback);
  }

  // --- Helper chung để trả về path hoặc fallback ---
  static String _getPath(String path, String? fallback) {
    // Trên Web hoặc nếu asset không tồn tại, trả về fallback
    return path; // Flutter sẽ tự load và fallback nếu asset không có
  }
}
