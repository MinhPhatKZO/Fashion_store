import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../services/cart_service.dart';

import 'home_style.dart'; // Giả sử kPrimaryColor được định nghĩa ở đây
import '../product/product_detail_screen.dart';
import '../cart/cart_screen.dart';
import 'widgets/home_body.dart';
import 'widgets/home_drawer.dart';

// NEW IMPORTS
import '../category/category_screen.dart';
<<<<<<< HEAD
import '../order/order_tracking_screen.dart'; // ĐỔI TỪ favorites_screen
=======
import '../favorite/favorites_screen.dart';
>>>>>>> tan_new1
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String username = '';
  String email = '';
  String role = '';

  int _selectedIndex = 0;

  List<Product> products = [];
  bool isLoadingProducts = true;
  String? productsError;

  final ProductService _productService = ProductService();
  final CartService _cartService = CartService.instance;

  final PageController _pageController = PageController(viewportFraction: 0.48); // roll ngang
  int _currentPage = 0;
  Timer? _autoPlayTimer;
  bool _autoPlay = true;
  Duration _autoPlayInterval = const Duration(seconds: 5);

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _loadProducts();
    _cartService.load();
    _cartService.addListener(_onCartChanged);
  }

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    _cartService.removeListener(_onCartChanged);
    super.dispose();
  }

  void _onCartChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      username =
          prefs.getString('username') ?? prefs.getString('email') ?? 'User';
      email = prefs.getString('email') ?? '';
      role = (prefs.getString('role') ?? 'customer').toLowerCase();
    });
  }

  Future<void> _loadProducts() async {
    setState(() {
      isLoadingProducts = true;
      productsError = null;
    });

    try {
      final fetchedProducts = await _productService.getAllProducts(limit: 10);
      setState(() {
        products = fetchedProducts;
        isLoadingProducts = false;
      });
      _startAutoPlayIfNeeded();
    } catch (e) {
      setState(() {
        productsError = e.toString();
        isLoadingProducts = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Không thể tải sản phẩm: ${e.toString()}'),
            action: SnackBarAction(label: 'Thử lại', onPressed: _loadProducts),
          ),
        );
      }
    }
  }

<<<<<<< HEAD
=======
  // chuyển sang m

>>>>>>> tan_new1
  void _startAutoPlayIfNeeded() {
    _autoPlayTimer?.cancel();
    if (!_autoPlay || products.isEmpty) return;
    _autoPlayTimer = Timer.periodic(_autoPlayInterval, (_) {
      final next = (_currentPage + 1) % products.length;

      if (mounted) {
        _pageController.animateToPage(
          next,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _navigateToCart() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CartScreen()),
    );
  }

  void _prevPage() {
    if (products.isEmpty) return;
    final prev = (_currentPage - 1) < 0 ? products.length - 1 : _currentPage - 1;

    _pageController.animateToPage(
      prev,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _nextPage() {
    if (products.isEmpty) return;
    final next = (_currentPage + 1) % products.length;

    _pageController.animateToPage(
      next,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _onProductTap(Product product) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)),
    );
  }

  // CHỈ ĐỔI TAB — navigation thật sẽ ở _getBodyContent()
  void _onBottomNavTap(int index) {
    // Nếu chuyển sang tab hiện tại thì không làm gì
    if (_selectedIndex == index) return;
    
    // Nếu bạn muốn hủy auto play khi chuyển khỏi Home (tab 0)
    if (_selectedIndex == 0) {
      _autoPlayTimer?.cancel();
    }
    
    // Nếu chuyển về Home (tab 0), bắt đầu lại auto play
    if (index == 0) {
      _startAutoPlayIfNeeded();
    }

    setState(() {
      _selectedIndex = index;
    });
  }

  // MỞ TRANG THEO TAB
  Widget _getBodyContent() {
    switch (_selectedIndex) {
      case 0:
<<<<<<< HEAD
        // HOME TAB
=======
>>>>>>> tan_new1
        return HomeBody(
          products: products,
          isLoadingProducts: isLoadingProducts,
          productsError: productsError,
          pageController: _pageController,
          currentPage: _currentPage,
          onPageChanged: (i) {
            setState(() => _currentPage = i);
            // Khởi động lại timer sau khi người dùng tương tác
            _autoPlayTimer?.cancel();
            _startAutoPlayIfNeeded();
          },
          onPrev: _prevPage,
          onNext: _nextPage,
          loadProducts: _loadProducts,
          onProductTap: _onProductTap,
        );

      case 1:
<<<<<<< HEAD
        // MALL TAB - Tất cả sản phẩm
        return const CategoryScreen(
          categoryName: 'All Products',
          categoryId: null,
        );

      case 2:
        // ORDER TRACKING TAB - ĐỔI TỪ FAVORITES
        return const OrderTrackingScreen();

      case 3:
        // PROFILE TAB
        return ProfileScreen(username: username, email: email);

      default:
        // Default về HomeBody
=======
        // Cung cấp categoryName cho màn hình "Mall" / "All Products"
        return const CategoryScreen(
          categoryName: 'All Products', // **Cần cung cấp tham số bắt buộc**
          categoryId: null,             // ID là null để CategoryScreen tải tất cả
        );

      case 2:
        return const FavoritesScreen();

      case 3:
        return ProfileScreen(username: username, email: email);

      default:
        // Thay vì trả về HomeScreen (gây lặp vô hạn), trả về HomeBody
>>>>>>> tan_new1
        return HomeBody(
          products: products,
          isLoadingProducts: isLoadingProducts,
          productsError: productsError,
          pageController: _pageController,
          currentPage: _currentPage,
          onPageChanged: (i) {
            setState(() => _currentPage = i);
            _startAutoPlayIfNeeded();
          },
          onPrev: _prevPage,
          onNext: _nextPage,
          loadProducts: _loadProducts,
          onProductTap: _onProductTap,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartItemCount = _cartService.items.fold<int>(
      0,
      (sum, item) => sum + item.quantity,
    );

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.black87),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: const Text(
          'Fashion Store',
          style: TextStyle(
            color: kPrimaryColor,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined,
                    color: Colors.black87),
                onPressed: _navigateToCart,
              ),
              if (cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red.shade600,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$cartItemCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined,
                color: Colors.black87),
            onPressed: () {},
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: HomeDrawer(
        username: username,
        email: email,
        onNavigateToCart: _navigateToCart,
        onLogout: () async {
          final prefs = await SharedPreferences.getInstance();
          await prefs.clear();
          // Đảm bảo bạn có route '/login' được định nghĩa trong MaterialApp
          if (mounted) Navigator.pushReplacementNamed(context, '/login');
        },
      ),
      body: _getBodyContent(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onBottomNavTap,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: kPrimaryColor,
        unselectedItemColor: Colors.grey[600],
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.category_outlined),
            activeIcon: Icon(Icons.category),
            label: 'Mall',
          ),
          BottomNavigationBarItem(
<<<<<<< HEAD
            icon: Icon(Icons.local_shipping_outlined), // ĐỔI ICON
            activeIcon: Icon(Icons.local_shipping),     // ĐỔI ICON
            label: 'Đơn hàng',                         // ĐỔI LABEL
=======
            icon: Icon(Icons.favorite_border),
            activeIcon: Icon(Icons.favorite),
            label: 'Favorites',
>>>>>>> tan_new1
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}