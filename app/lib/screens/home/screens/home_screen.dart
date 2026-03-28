import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

// --- Import đường dẫn chính xác dựa trên cây thư mục ---
import '../../../models/product.dart';
import '../../../services/product_service.dart';
import '../../../services/cart_service.dart';

import '../widgets/home_body.dart';
import '../widgets/home_drawer.dart';

import '../../product/product_detail_screen.dart';
import '../../cart/cart_screen.dart';
import '../../category/category_screen.dart';
import '../../order/order_tracking_screen.dart'; 
import '../../profile/profile_screen.dart';
import 'notifications_screen.dart'; // Đã sửa đường dẫn import

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

  final PageController _pageController = PageController(viewportFraction: 0.48); 
  int _currentPage = 0;
  Timer? _autoPlayTimer;
  final bool _autoPlay = true;
  final Duration _autoPlayInterval = const Duration(seconds: 5);

  // Khai báo mã màu thương hiệu KZONE Central
  final Color kzoneBrown = const Color(0xFF8B4513);
  final Color kzoneBeige = const Color(0xFFFAF7F2);

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
    if (!mounted) return; 
    setState(() {
      username =
          prefs.getString('username') ?? prefs.getString('userName') ?? 'User';
      email = prefs.getString('email') ?? '';
      role = (prefs.getString('role') ?? 'customer').toLowerCase();
    });
  }

  Future<void> _loadProducts() async {
    if (!mounted) return;
    setState(() {
      isLoadingProducts = true;
      productsError = null;
    });

    try {
      final fetchedProducts = await _productService.getAllProducts(limit: 10);
      if (!mounted) return;
      setState(() {
        products = fetchedProducts;
        isLoadingProducts = false;
      });
      _startAutoPlayIfNeeded();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        productsError = e.toString();
        isLoadingProducts = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không thể tải sản phẩm: ${e.toString()}'),
          backgroundColor: Colors.red.shade700,
          action: SnackBarAction(
            label: 'Thử lại', 
            textColor: Colors.white,
            onPressed: _loadProducts
          ),
        ),
      );
    }
  }

  void _startAutoPlayIfNeeded() {
    _autoPlayTimer?.cancel();
    if (!_autoPlay || products.isEmpty) return;
    _autoPlayTimer = Timer.periodic(_autoPlayInterval, (_) {
      final next = (_currentPage + 1) % products.length;

      if (mounted && _pageController.hasClients) {
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

  void _onBottomNavTap(int index) {
    if (_selectedIndex == index) return;
    
    if (_selectedIndex == 0) {
      _autoPlayTimer?.cancel();
    }
    
    if (index == 0) {
      _startAutoPlayIfNeeded();
    }

    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _getBodyContent() {
    switch (_selectedIndex) {
      case 0:
        return HomeBody(
          products: products,
          isLoadingProducts: isLoadingProducts,
          productsError: productsError,
          pageController: _pageController,
          currentPage: _currentPage,
          onPageChanged: (i) {
            setState(() => _currentPage = i);
            _autoPlayTimer?.cancel();
            _startAutoPlayIfNeeded();
          },
          onPrev: _prevPage,
          onNext: _nextPage,
          loadProducts: _loadProducts,
          onProductTap: _onProductTap,
        );

      case 1:
        return const CategoryScreen(
          categoryName: 'Tất cả sản phẩm',
          categoryId: null,
        );

      case 2:
        return const OrderTrackingScreen();

      case 3:
        return ProfileScreen(username: username, email: email);

      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartItemCount = _cartService.items.fold<int>(
      0,
      (sum, item) => sum + item.quantity,
    );

    return Scaffold(
      backgroundColor: kzoneBeige, 
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        shadowColor: kzoneBrown.withValues(alpha: 0.2), 
        leading: Builder(
          builder: (context) => IconButton(
            icon: Icon(Icons.menu_rounded, color: kzoneBrown, size: 28),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shopping_bag_outlined, color: kzoneBrown, size: 24),
            const SizedBox(width: 8),
            Text(
              'KZONE CENTRAL',
              style: TextStyle(
                color: kzoneBrown,
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: Icon(Icons.shopping_cart_outlined, color: kzoneBrown, size: 26),
                onPressed: _navigateToCart,
              ),
              if (cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFA0522D),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: Text(
                      '$cartItemCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          
          // 👇 Chỉ giữ lại 1 nút Chuông có gắn sẵn điều hướng
          IconButton(
            icon: Icon(Icons.notifications_none_rounded, color: kzoneBrown, size: 28),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const NotificationsScreen(),
                ),
              );
            },
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
          
          if (!context.mounted) return; // 👇 Đã sửa thành context.mounted
          Navigator.pushReplacementNamed(context, '/login');
        },
      ),
      body: _getBodyContent(),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: kzoneBrown.withValues(alpha: 0.05),
              blurRadius: 20,
              offset: const Offset(0, -5),
            )
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onBottomNavTap,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: kzoneBrown, 
          unselectedItemColor: Colors.grey.shade400,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.home_outlined)),
              activeIcon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.home_rounded)),
              label: 'Trang chủ',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.category_outlined)),
              activeIcon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.category_rounded)),
              label: 'Sản phẩm',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.local_shipping_outlined)),
              activeIcon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.local_shipping_rounded)),
              label: 'Đơn hàng',
            ),
            BottomNavigationBarItem(
              icon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.person_outline_rounded)),
              activeIcon: Padding(padding: EdgeInsets.only(bottom: 4), child: Icon(Icons.person_rounded)),
              label: 'Tài khoản',
            ),
          ],
        ),
      ),
    );
  }
}