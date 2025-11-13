import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../services/cart_service.dart';
import 'home_style.dart';
import '../product/product_detail_screen.dart';
import '../cart/cart_screen.dart';
import 'widgets/home_body.dart';
import 'widgets/home_drawer.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String username = '';
  String email = '';
  String role = '';

  // Product loading states
  List<Product> products = [];
  bool isLoadingProducts = true;
  String? productsError;

  final ProductService _productService = ProductService();
  final CartService _cartService = CartService.instance;

  // Page controller for product pager
  final PageController _pageController = PageController(viewportFraction: 0.48);
  // pager state
  int _currentPage = 0;
  Timer? _autoPlayTimer;
  bool _autoPlay = true;
  Duration _autoPlayInterval = const Duration(seconds: 5);

  // small local helpers

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
    if (mounted) {
      setState(() {});
    }
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
      // start or reset autoplay when products available
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

  void _startAutoPlayIfNeeded() {
    _autoPlayTimer?.cancel();
    if (!_autoPlay || products.isEmpty) return;
    _autoPlayTimer = Timer.periodic(_autoPlayInterval, (_) {
      if (products.isEmpty) return;
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

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('username');
    await prefs.remove('email');
    await prefs.remove('role');
    Navigator.pushReplacementNamed(context, '/login');
  }

  void _navigateToCart() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CartScreen()),
    );
  }

  void _prevPage() {
    if (products.isEmpty) return;
    final prev = (_currentPage - 1) < 0
        ? products.length - 1
        : _currentPage - 1;
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

  @override
  Widget build(BuildContext context) {
    // Calculate total items in cart
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
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text(
              'Mansoury',
              style: TextStyle(
                color: kPrimaryColor,
                fontSize: 24,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            Text(
              '.',
              style: TextStyle(
                color: kPrimaryColor,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.shopping_cart_outlined,
                  color: Colors.black87,
                ),
                onPressed: _navigateToCart,
              ),
              if (cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.all(Radius.circular(10)),
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
            icon: const Icon(
              Icons.notifications_outlined,
              color: Colors.black87,
            ),
            onPressed: () {},
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: HomeDrawer(
        username: username,
        email: email,
        onNavigateToCart: _navigateToCart,
        onLogout: _logout,
      ),
      body: HomeBody(
        products: products,
        isLoadingProducts: isLoadingProducts,
        productsError: productsError,
        pageController: _pageController,
        currentPage: _currentPage,
        onPageChanged: (i) {
          setState(() {
            _currentPage = i;
          });
          _startAutoPlayIfNeeded();
        },
        onPrev: _prevPage,
        onNext: _nextPage,
        loadProducts: _loadProducts,
        onProductTap: _onProductTap,
      ),
    );
  }
}
