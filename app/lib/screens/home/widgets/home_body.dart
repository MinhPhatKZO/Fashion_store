import 'package:flutter/material.dart';

import '../home_style.dart';
import '../../../models/product.dart';
import 'product_card.dart';
import 'feature_item.dart';

class HomeBody extends StatelessWidget {
  final List<Product> products;
  final bool isLoadingProducts;
  final String? productsError;
  final PageController pageController;
  final int currentPage;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback loadProducts;
  final void Function(Product) onProductTap;

  const HomeBody({
    super.key,
    required this.products,
    required this.isLoadingProducts,
    required this.productsError,
    required this.pageController,
    required this.currentPage,
    required this.onPageChanged,
    required this.onPrev,
    required this.onNext,
    required this.loadProducts,
    required this.onProductTap,
  });

  Widget _buildPageIndicator() {
    return SizedBox(
      height: 20,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(products.length, (i) {
          final isActive = i == currentPage;
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

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
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
                    TextButton(onPressed: () {}, child: const Text('See All')),
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
                              onPressed: loadProducts,
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
                                  controller: pageController,
                                  itemCount: products.length,
                                  pageSnapping: true,
                                  padEnds: false,
                                  onPageChanged: onPageChanged,
                                  itemBuilder: (context, index) => Padding(
                                    padding: EdgeInsets.only(
                                      left: index == 0 ? 16 : 6,
                                      right: index < products.length - 1
                                          ? 12
                                          : 16,
                                    ),
                                    child: SizedBox(
                                      child: ProductCard(
                                        product: products[index],
                                        onTap: () =>
                                            onProductTap(products[index]),
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
                                      onPressed: onPrev,
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
                                      onPressed: onNext,
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
                    FeatureItem(
                      icon: Icons.headset_mic_outlined,
                      title: 'Online Support',
                      subtitle: 'Dedicated Support Team',
                    ),
                    FeatureItem(
                      icon: Icons.local_shipping_outlined,
                      title: 'Free Shipping',
                      subtitle: '7 days Replacement',
                    ),
                    FeatureItem(
                      icon: Icons.access_time_outlined,
                      title: 'Timeless Shopping',
                      subtitle: '24/7 Shopping',
                    ),
                    FeatureItem(
                      icon: Icons.assignment_return_outlined,
                      title: 'Product Returns',
                      subtitle: 'No Question Asked Returns',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
