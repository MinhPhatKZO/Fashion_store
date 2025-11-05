import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api';
  late Dio _dio;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove('token');
            await prefs.remove('user');
          }
          handler.next(error);
        },
      ),
    );
  }

  // Auth API
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/register',
      data: {'name': name, 'email': email, 'password': password},
    );
    return response.data;
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return response.data;
  }

  Future<Map<String, dynamic>> getMe() async {
    final response = await _dio.get('/auth/me');
    return response.data;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await _dio.put('/auth/profile', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _dio.put(
      '/auth/change-password',
      data: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
    return response.data;
  }

  // Products API
  Future<Map<String, dynamic>> getProducts({
    int page = 1,
    int limit = 12,
    String? category,
    String? subcategory,
    String? brand,
    double? minPrice,
    double? maxPrice,
    double? rating,
    String? search,
    String? sort,
    bool? isFeatured,
    bool? isOnSale,
  }) async {
    final queryParams = <String, dynamic>{'page': page, 'limit': limit};

    if (category != null) queryParams['category'] = category;
    if (subcategory != null) queryParams['subcategory'] = subcategory;
    if (brand != null) queryParams['brand'] = brand;
    if (minPrice != null) queryParams['minPrice'] = minPrice;
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice;
    if (rating != null) queryParams['rating'] = rating;
    if (search != null) queryParams['search'] = search;
    if (sort != null) queryParams['sort'] = sort;
    if (isFeatured != null) queryParams['isFeatured'] = isFeatured;
    if (isOnSale != null) queryParams['isOnSale'] = isOnSale;

    final response = await _dio.get('/products', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> getProduct(String id) async {
    final response = await _dio.get('/products/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> getFeaturedProducts() async {
    final response = await _dio.get('/products/featured');
    return response.data;
  }

  Future<Map<String, dynamic>> getRelatedProducts(String id) async {
    final response = await _dio.get('/products/related/$id');
    return response.data;
  }

  // Categories API
  Future<Map<String, dynamic>> getCategories() async {
    final response = await _dio.get('/categories');
    return response.data;
  }

  Future<Map<String, dynamic>> getCategory(String id) async {
    final response = await _dio.get('/categories/$id');
    return response.data;
  }

  // Orders API
  Future<Map<String, dynamic>> getOrders({
    int page = 1,
    int limit = 10,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{'page': page, 'limit': limit};

    if (status != null) queryParams['status'] = status;

    final response = await _dio.get('/orders', queryParameters: queryParams);
    return response.data;
  }

  Future<Map<String, dynamic>> getOrder(String id) async {
    final response = await _dio.get('/orders/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final response = await _dio.post('/orders', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> cancelOrder(String id, {String? reason}) async {
    final response = await _dio.put(
      '/orders/$id/cancel',
      data: {'reason': reason},
    );
    return response.data;
  }

  // Reviews API
  Future<Map<String, dynamic>> getProductReviews(
    String productId, {
    int page = 1,
    int limit = 10,
    double? rating,
  }) async {
    final queryParams = <String, dynamic>{'page': page, 'limit': limit};

    if (rating != null) queryParams['rating'] = rating;

    final response = await _dio.get(
      '/reviews/product/$productId',
      queryParameters: queryParams,
    );
    return response.data;
  }

  Future<Map<String, dynamic>> createReview(Map<String, dynamic> data) async {
    final response = await _dio.post('/reviews', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> updateReview(
    String id,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.put('/reviews/$id', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> deleteReview(String id) async {
    final response = await _dio.delete('/reviews/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> markReviewHelpful(String id) async {
    final response = await _dio.post('/reviews/$id/helpful');
    return response.data;
  }

  // Users API
  Future<Map<String, dynamic>> getWishlist() async {
    final response = await _dio.get('/users/wishlist');
    return response.data;
  }

  Future<Map<String, dynamic>> addToWishlist(String productId) async {
    final response = await _dio.post(
      '/users/wishlist',
      data: {'productId': productId},
    );
    return response.data;
  }

  Future<Map<String, dynamic>> removeFromWishlist(String productId) async {
    final response = await _dio.delete('/users/wishlist/$productId');
    return response.data;
  }

  Future<Map<String, dynamic>> getAddresses() async {
    final response = await _dio.get('/users/addresses');
    return response.data;
  }

  Future<Map<String, dynamic>> addAddress(Map<String, dynamic> data) async {
    final response = await _dio.post('/users/addresses', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> updateAddress(
    String id,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.put('/users/addresses/$id', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> deleteAddress(String id) async {
    final response = await _dio.delete('/users/addresses/$id');
    return response.data;
  }

  // Upload API
  Future<Map<String, dynamic>> uploadImage(String imagePath) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(imagePath),
    });

    final response = await _dio.post('/upload/single', data: formData);
    return response.data;
  }

  Future<Map<String, dynamic>> uploadImages(List<String> imagePaths) async {
    final formData = FormData();

    for (final path in imagePaths) {
      formData.files.add(
        MapEntry('images', await MultipartFile.fromFile(path)),
      );
    }

    final response = await _dio.post('/upload/multiple', data: formData);
    return response.data;
  }

  // Payment API
  Future<Map<String, dynamic>> createPaymentIntent(String orderId) async {
    final response = await _dio.post(
      '/payment/create-payment-intent',
      data: {'orderId': orderId},
    );
    return response.data;
  }

  Future<Map<String, dynamic>> confirmPayment({
    required String paymentIntentId,
    required String orderId,
  }) async {
    final response = await _dio.post(
      '/payment/confirm',
      data: {'paymentIntentId': paymentIntentId, 'orderId': orderId},
    );
    return response.data;
  }
}


