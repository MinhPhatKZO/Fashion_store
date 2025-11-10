import 'package:flutter/material.dart';

import '../../models/product.dart';
import '../../services/cart_service.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({Key? key, required this.product})
    : super(key: key);

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final PageController _pageController = PageController();
  int _currentImage = 0;
  int _quantity = 1;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final images = product.fullImageUrls.isNotEmpty
        ? product.fullImageUrls
        : [product.displayImage];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: const SizedBox.shrink(),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1100),
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: 28.0,
                  horizontal: 20.0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Main area: two-column on wide screens, stacked on narrow
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth > 800;
                        return isWide
                            ? Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Left: large product image
                                  Expanded(
                                    flex: 5,
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: AspectRatio(
                                        aspectRatio: 3 / 4,
                                        child: _buildImage(
                                          images.isNotEmpty
                                              ? images[0]
                                              : product.displayImage,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 48),

                                  // Right: product details
                                  Expanded(
                                    flex: 5,
                                    child: _buildDetailCard(context, product),
                                  ),
                                ],
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: AspectRatio(
                                      aspectRatio: 3 / 4,
                                      child: _buildImage(
                                        images.isNotEmpty
                                            ? images[0]
                                            : product.displayImage,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 18),
                                  _buildDetailCard(context, product),
                                ],
                              );
                      },
                    ),

                    const SizedBox(height: 40),

                    // Related products
                    const Text(
                      'Related products',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 260,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: 6,
                        separatorBuilder: (_, __) => const SizedBox(width: 16),
                        itemBuilder: (context, index) {
                          final img = images.isNotEmpty
                              ? images[0]
                              : product.displayImage;
                          return SizedBox(
                            width: 200,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: AspectRatio(
                                    aspectRatio: 1,
                                    child: _buildImage(img, fit: BoxFit.cover),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Product',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Description of product',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  '\$10.99',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailCard(BuildContext context, Product product) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          product.name,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        const Text(
          'Subheading',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        const SizedBox(height: 10),
        Text(
          '\$${product.price.toStringAsFixed(2)}',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Text(
          product.description,
          style: const TextStyle(color: Colors.black87, height: 1.4),
        ),
        const SizedBox(height: 20),

        Row(
          children: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              onPressed: () async {
                // add to cart and navigate to cart screen
                await CartService.instance.add(product, quantity: _quantity);
                // go to cart
                if (mounted) {
                  Navigator.pushNamed(context, '/cart');
                }
              },
              child: const Text(
                'Add to cart',
                style: TextStyle(color: Colors.white),
              ),
            ),
            const SizedBox(width: 12),
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.black,
                side: const BorderSide(color: Colors.black),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              onPressed: () {},
              child: const Text('Buy Online'),
            ),
          ],
        ),

        const SizedBox(height: 12),
        const Text(
          'Text box for additional details or fine print',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildImage(String src, {BoxFit fit = BoxFit.cover}) {
    if (src.startsWith('http')) {
      return Image.network(
        src,
        fit: fit,
        width: double.infinity,
        errorBuilder: (_, __, ___) => _imagePlaceholder(),
      );
    }
    return Image.asset(
      src,
      fit: fit,
      width: double.infinity,
      errorBuilder: (_, __, ___) => _imagePlaceholder(),
    );
  }

  Widget _imagePlaceholder() => Container(
    color: Colors.grey.shade100,
    child: const Center(
      child: Icon(Icons.broken_image, size: 56, color: Colors.grey),
    ),
  );
}
