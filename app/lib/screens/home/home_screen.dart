import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../services/cart_service.dart';
import 'home_style.dart';
import '../product/product_detail_screen.dart';
import '../cart/cart_screen.dart';

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
  BorderRadius get _cardBorderRadius => BorderRadius.circular(kCardRadius);

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
      drawer: _buildDrawer(),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Banner - smaller promo strip
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Material(
                    elevation: 2,
                    borderRadius: BorderRadius.circular(8),
                    color: kPrimaryColor,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        vertical: 10,
                        horizontal: 12,
                      ),
                      child: const Text(
                        'Winter is coming! 60% off this new year!',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 13),
                      ),
                    ),
                  ),
                ),

                // Search Bar
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Material(
                          elevation: 2,
                          borderRadius: BorderRadius.circular(8),
                          child: TextField(
                            decoration: InputDecoration(
                              hintText: 'Search products...',
                              prefixIcon: const Icon(
                                Icons.search,
                                color: kPrimaryColor,
                              ),
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide.none,
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                vertical: 12,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: kPrimaryColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: IconButton(
                          icon: const Icon(
                            Icons.filter_list,
                            color: Colors.white,
                          ),
                          onPressed: () {},
                        ),
                      ),
                    ],
                  ),
                ),

                // Hero Banner - rounded card with stronger elevation
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Container(
                      height: 180,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [kPrimaryColor, Color(0xFF5DCFFF)],
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              'Enhance Your Style with',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const Text(
                              'Fashion & Elegance',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: kPrimaryColor,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                              child: const Text('Shop Now'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Discover Best Deals
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Discover Best Deals\nfor Fashion!',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Discover your style, shop the latest\ntrends in fashion.',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF40BFFF),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'Explore More',
                            style: TextStyle(fontSize: 16, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Products Section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Products',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: const Text('See All'),
                      ),
                    ],
                  ),
                ),

                SizedBox(
                  height: 300,
                  child: isLoadingProducts
                      ? const Center(child: CircularProgressIndicator())
                      : productsError != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.error_outline,
                                size: 48,
                                color: Colors.grey,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Không thể tải sản phẩm',
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: _loadProducts,
                                child: const Text('Thử lại'),
                              ),
                            ],
                          ),
                        )
                      : products.isEmpty
                      ? Center(
                          child: Text(
                            'Chưa có sản phẩm nào',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        )
                      : Column(
                          children: [
                            Expanded(
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  PageView.builder(
                                    controller: _pageController,
                                    itemCount: products.length,
                                    pageSnapping: true,
                                    padEnds: false,
                                    onPageChanged: (i) {
                                      setState(() {
                                        _currentPage = i;
                                      });
                                      _startAutoPlayIfNeeded();
                                    },
                                    itemBuilder: (context, index) => Padding(
                                      padding: EdgeInsets.only(
                                        left: index == 0 ? 16 : 6,
                                        right: index < products.length - 1
                                            ? 12
                                            : 16,
                                      ),
                                      child: SizedBox(
                                        child: _buildProductCard(
                                          products[index],
                                        ),
                                      ),
                                    ),
                                  ),
                                  // Prev button
                                  Positioned(
                                    left: 4,
                                    child: Material(
                                      color: Colors.black.withOpacity(0.05),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: IconButton(
                                        icon: const Icon(Icons.chevron_left),
                                        onPressed: () {
                                          final prev = (_currentPage - 1) < 0
                                              ? products.length - 1
                                              : _currentPage - 1;
                                          _pageController.animateToPage(
                                            prev,
                                            duration: const Duration(
                                              milliseconds: 300,
                                            ),
                                            curve: Curves.easeInOut,
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                  // Next button
                                  Positioned(
                                    right: 4,
                                    child: Material(
                                      color: Colors.black.withOpacity(0.05),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: IconButton(
                                        icon: const Icon(Icons.chevron_right),
                                        onPressed: () {
                                          final next =
                                              (_currentPage + 1) %
                                              products.length;
                                          _pageController.animateToPage(
                                            next,
                                            duration: const Duration(
                                              milliseconds: 300,
                                            ),
                                            curve: Curves.easeInOut,
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                            // page indicator
                            _buildPageIndicator(),
                          ],
                        ),
                ),

                const SizedBox(height: 24),

                // Features Section
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildFeatureItem(
                        Icons.headset_mic_outlined,
                        'Online Support',
                        'Dedicated Support Team',
                      ),
                      _buildFeatureItem(
                        Icons.local_shipping_outlined,
                        'Free Shipping',
                        '7 days Replacement',
                      ),
                      _buildFeatureItem(
                        Icons.access_time_outlined,
                        'Timeless Shopping',
                        '24/7 Shopping',
                      ),
                      _buildFeatureItem(
                        Icons.assignment_return_outlined,
                        'Product Returns',
                        'No Question Asked Returns',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    return Material(
      elevation: 2,
      borderRadius: _cardBorderRadius,
      color: Colors.white,
      child: InkWell(
        borderRadius: _cardBorderRadius,
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProductDetailScreen(product: product),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // image area
            Stack(
              children: [
                Container(
                  height: 160,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE3F2FD),
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(kCardRadius),
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(kCardRadius),
                    ),
                    child: product.displayImage.isNotEmpty
                        ? (product.displayImage.startsWith('http')
                              ? Image.network(
                                  product.displayImage,
                                  height: 160,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  loadingBuilder:
                                      (context, child, loadingProgress) {
                                        if (loadingProgress == null)
                                          return child;
                                        return Center(
                                          child: CircularProgressIndicator(
                                            value:
                                                loadingProgress
                                                        .expectedTotalBytes !=
                                                    null
                                                ? loadingProgress
                                                          .cumulativeBytesLoaded /
                                                      loadingProgress
                                                          .expectedTotalBytes!
                                                : null,
                                          ),
                                        );
                                      },
                                  errorBuilder: (context, error, stackTrace) {
                                    print(
                                      '❌ Error loading network image: $error',
                                    );
                                    return const Center(
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.image_not_supported,
                                            size: 40,
                                            color: Colors.grey,
                                          ),
                                          SizedBox(height: 4),
                                          Text(
                                            'No Image',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                )
                              : Image.asset(
                                  product.displayImage,
                                  height: 160,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    print(
                                      '❌ Error loading asset image: $error',
                                    );
                                    return const Center(
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.image_not_supported,
                                            size: 40,
                                            color: Colors.grey,
                                          ),
                                          SizedBox(height: 4),
                                          Text(
                                            'No Image',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ))
                        : const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.image_outlined,
                                  size: 50,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'No Image',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                  ),
                ),
                if (product.isFeatured)
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'HOT',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Material(
                    color: Colors.white.withOpacity(0.9),
                    shape: const CircleBorder(),
                    child: IconButton(
                      icon: const Icon(
                        Icons.favorite_border,
                        size: 18,
                        color: Colors.red,
                      ),
                      onPressed: () {},
                    ),
                  ),
                ),
                if (product.discountPercent != null)
                  Positioned(
                    top: 8,
                    right: 52,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '-${product.discountPercent}%',
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
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${product.price.toStringAsFixed(0)}₫',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: kPrimaryColor,
                              ),
                            ),
                            if (product.isOnSale &&
                                product.originalPrice != null)
                              Text(
                                '${product.originalPrice!.toStringAsFixed(0)}₫',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[500],
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: product.isInStock
                              ? kPrimaryColor
                              : Colors.grey,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          product.isInStock
                              ? Icons.add_shopping_cart
                              : Icons.remove_shopping_cart,
                          size: 16,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  if (!product.isInStock)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        'Hết hàng',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.red[400],
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPageIndicator() {
    return SizedBox(
      height: 20,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(products.length, (i) {
          final isActive = i == _currentPage;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 4),
            width: isActive ? 10 : 8,
            height: isActive ? 10 : 8,
            decoration: BoxDecoration(
              color: isActive ? kPrimaryColor : Colors.grey[300],
              shape: BoxShape.circle,
            ),
          );
        }),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFE3F2FD),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 28, color: const Color(0xFF40BFFF)),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(username),
              accountEmail: Text(email),
              currentAccountPicture: const CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(Icons.person, size: 40, color: Colors.grey),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Home'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Profile'),
              onTap: () {
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.shopping_cart),
              title: const Text('Cart'),
              onTap: () {
                Navigator.pop(context);
                _navigateToCart();
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Logout'),
              onTap: _logout,
            ),
          ],
        ),
      ),
    );
  }
}