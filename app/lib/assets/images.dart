import 'package:flutter/widgets.dart';

/// Class quản lý đường dẫn hình ảnh trong ứng dụng
class AppImages {
  // Private constructor để không thể tạo instance
  AppImages._();

  // Base path
  static const String _basePath = 'assets';

  // === PRODUCT IMAGES ===
  // Áo thun & Áo phông
  static const String aothunNike = '$_basePath/images/aothunnike.jpg';
  static const String hmShirtWomen = '$_basePath/images/hm-shirt-women.jpg';
  static const String nikeKidShirt = '$_basePath/images/nike-kid-shirt.jpg';

  // Áo sơ mi
  static const String aosomiNamHM = '$_basePath/images/aosominamH&M.jpg';
  static const String gucciShirtWomen =
      '$_basePath/images/gucci-shirt-women.jpg';

  // Áo khoác & Hoodie
  static const String adidasHoodie = '$_basePath/images/adidas-hoodie.jpg';
  static const String gucciJacket = '$_basePath/images/gucci-jacket.jpg';
  static const String zaraJacketWomen =
      '$_basePath/images/zara-jacket-women.jpg';

  // Áo polo
  static const String adidasPolo = '$_basePath/images/adidas-polo.jpg';

  // Quần & Váy
  static const String jeanNuZara = '$_basePath/images/jeannuZara.jpg';
  static const String vayNuGucci = '$_basePath/images/vaynugucci.jpg';
  static const String hmDress = '$_basePath/images/hm-dress.jpg';

  // Giày dép
  static const String giayAdidas = '$_basePath/images/giayadidas.jpg';
  static const String giayNike = '$_basePath/images/giaynike.jpg';
  static const String zaraSneakers = '$_basePath/images/zara-sneakers.jpg';
  static const String hmBoots = '$_basePath/images/hm-boots.jpg';

  // Phụ kiện - Túi & Balo
  static const String baloHM = '$_basePath/images/baloH&M.jpg';
  static const String zaraBag = '$_basePath/images/zara-bag.jpg';
  static const String gucciBag = '$_basePath/images/gucci-bag.jpg';

  // Phụ kiện - Mũ
  static const String nikeCap = '$_basePath/images/nike-cap.jpg';

  // === LOGO & BRANDING ===
  static const String logo = '$_basePath/images/logo.png';
  static const String logoWhite = '$_basePath/images/logo_white.png';

  // === ICONS ===
  static const String iconHome = '$_basePath/images/icon_home.png';
  static const String iconCart = '$_basePath/images/icon_cart.png';
  static const String iconUser = '$_basePath/images/icon_user.png';
  static const String iconSearch = '$_basePath/images/icon_search.png';

  // === BANNERS ===
  static const String bannerSale = '$_basePath/images/banner_sale.jpg';
  static const String bannerNewArrival =
      '$_basePath/images/banner_new_arrival.jpg';

  // === BRAND LOGOS ===
  static const String brandNike = '$_basePath/images/brands/nike.png';
  static const String brandAdidas = '$_basePath/images/brands/adidas.png';
  static const String brandZara = '$_basePath/images/brands/zara.png';
  static const String brandHM = '$_basePath/images/brands/hm.png';
  static const String brandGucci = '$_basePath/images/brands/gucci.png';

  // === CATEGORIES ===
  static const String categoryMen = '$_basePath/images/category_men.jpg';
  static const String categoryWomen = '$_basePath/images/category_women.jpg';
  static const String categoryKids = '$_basePath/images/category_kids.jpg';
  static const String categoryAccessories =
      '$_basePath/images/category_accessories.jpg';
  static const String categoryShoes = '$_basePath/images/category_shoes.jpg';

  // === PLACEHOLDERS ===
  static const String placeholder = '$_basePath/images/placeholder.png';
  static const String noImage = '$_basePath/images/no_image.png';
  static const String userAvatar = '$_basePath/images/user_avatar.png';

  // === BACKGROUNDS ===
  static const String bgPattern = '$_basePath/images/bg_pattern.png';
  static const String bgSplash = '$_basePath/images/bg_splash.jpg';

  // === EMPTY STATES ===
  static const String emptyCart = '$_basePath/images/empty_cart.png';
  static const String emptyOrder = '$_basePath/images/empty_order.png';
  static const String emptySearch = '$_basePath/images/empty_search.png';
  static const String emptyWishlist = '$_basePath/images/empty_wishlist.png';

  // === PAYMENT METHODS ===
  static const String paymentVisa = '$_basePath/images/payment_visa.png';
  static const String paymentMastercard =
      '$_basePath/images/payment_mastercard.png';
  static const String paymentMomo = '$_basePath/images/payment_momo.png';
  static const String paymentZaloPay = '$_basePath/images/payment_zalopay.png';
  static const String paymentCOD = '$_basePath/images/payment_cod.png';

  // Map product ID to image path
  static final Map<String, String> productImages = {
    '652f00000000000000000301': aothunNike,
    '652f00000000000000000302': aosomiNamHM,
    '652f00000000000000000303': jeanNuZara,
    '652f00000000000000000304': vayNuGucci,
    '652f00000000000000000305': giayAdidas,
    '652f00000000000000000306': giayNike,
    '652f00000000000000000307': baloHM,
    '652f00000000000000000308': zaraBag,
    '652f00000000000000000309': nikeCap,
    '652f00000000000000000310': adidasHoodie,
    '652f00000000000000000311': gucciJacket,
    '652f00000000000000000312': zaraSneakers,
    '652f00000000000000000313': hmShirtWomen,
    '652f00000000000000000314': hmDress,
    '652f00000000000000000315': adidasPolo,
    '652f00000000000000000316': gucciShirtWomen,
    '652f00000000000000000317': hmBoots,
    '652f00000000000000000318': zaraJacketWomen,
    '652f00000000000000000319': gucciBag,
    '652f00000000000000000320': nikeKidShirt,
  };

  // Map brand ID to logo
  static final Map<String, String> brandLogos = {
    '652f00000000000000000201': brandNike, // Nike
    '652f00000000000000000202': brandAdidas, // Adidas
    '652f00000000000000000203': brandZara, // Zara
    '652f00000000000000000204': brandHM, // H&M
    '652f00000000000000000205': brandGucci, // Gucci
  };

  // Map category ID to image
  static final Map<String, String> categoryImages = {
    '652f00000000000000000101': categoryMen, // Quần áo nam
    '652f00000000000000000102': categoryWomen, // Quần áo nữ
    '652f00000000000000000103': categoryKids, // Quần áo trẻ em
    '652f00000000000000000104': categoryAccessories, // Phụ kiện
    '652f00000000000000000105': categoryShoes, // Giày dép
  };

  /// Lấy hình ảnh sản phẩm theo ID
  static String getProductImage(String productId, {String? fallback}) {
    return productImages[productId] ?? fallback ?? placeholder;
  }

  /// Lấy logo thương hiệu theo ID
  static String getBrandLogo(String brandId, {String? fallback}) {
    return brandLogos[brandId] ?? fallback ?? placeholder;
  }

  /// Lấy hình ảnh danh mục theo ID
  static String getCategoryImage(String categoryId, {String? fallback}) {
    return categoryImages[categoryId] ?? fallback ?? placeholder;
  }

  /// Danh sách tất cả hình ảnh sản phẩm
  static List<String> get allProductImages => productImages.values.toList();

  /// Danh sách tất cả logo thương hiệu
  static List<String> get allBrandLogos => brandLogos.values.toList();

  /// Danh sách tất cả hình ảnh danh mục
  static List<String> get allCategoryImages => categoryImages.values.toList();

  /// Danh sách tất cả hình ảnh để preload
  static List<String> get allImages => [
    // Products
    ...allProductImages,
    // Brands
    ...allBrandLogos,
    // Categories
    ...allCategoryImages,
    // UI Elements
    logo,
    logoWhite,
    iconHome,
    iconCart,
    iconUser,
    iconSearch,
    bannerSale,
    bannerNewArrival,
    placeholder,
    noImage,
    userAvatar,
    bgPattern,
    bgSplash,
    emptyCart,
    emptyOrder,
    emptySearch,
    emptyWishlist,
    paymentVisa,
    paymentMastercard,
    paymentMomo,
    paymentZaloPay,
    paymentCOD,
  ];
}

/// Extension để sử dụng dễ dàng hơn
extension ImagePathExtension on String {
  /// Chuyển đổi đường dẫn thành AssetImage
  AssetImage get assetImage => AssetImage(this);

  /// Kiểm tra file có tồn tại không
  bool get exists => isNotEmpty;
}
