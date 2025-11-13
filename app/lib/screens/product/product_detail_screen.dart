import 'package:flutter/material.dart';

import '../../models/product.dart';
import '../../services/cart_service.dart';
import '../../services/product_service.dart';
import '../home/widgets/product_card.dart';

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
  final ProductService _productService = ProductService();
  List<Product> _related = [];
  bool _isLoadingRelated = true;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadRelatedProducts();
  }

  Future<void> _loadRelatedProducts() async {
    setState(() {
      _isLoadingRelated = true;
    });
    try {
      final list = await _productService.getAllProducts(limit: 8);
      final filtered = list.where((p) => p.id != widget.product.id).toList();
      setState(() {
        _related = filtered;
        _isLoadingRelated = false;
      });
    } catch (e) {
      setState(() {
        _related = [];
        _isLoadingRelated = false;
      });
    }
  }

  // Hàm xử lý thêm vào giỏ hàng
  void _handleAddToCart() async {
    await CartService.instance.add(widget.product, quantity: _quantity);
    if (mounted) {
      // Thay thế Navigator.pushNamed bằng SnackBar để thông báo
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🛒 Đã thêm ${widget.product.name} vào giỏ hàng!'),
          duration: const Duration(seconds: 2),
        ),
      );
      // Nếu muốn chuyển trang, dùng: Navigator.pushNamed(context, '/cart');
    }
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
                    // --- Phần Chi tiết sản phẩm (Product Detail) ---
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth > 800;
                        return isWide
                            ? Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Left: image gallery (5/10)
                                  Expanded(
                                    flex: 5,
                                    // SỬ DỤNG HÀM MỚI CHO GALLERY
                                    child: _buildImageGallery(images),
                                  ),
                                  const SizedBox(width: 48),

                                  // Right: product details (5/10)
                                  Expanded(
                                    flex: 5,
                                    child: _buildDetailCard(context, product),
                                  ),
                                ],
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Stacked: image gallery
                                  // SỬ DỤNG HÀM MỚI CHO GALLERY
                                  _buildImageGallery(images),
                                  const SizedBox(height: 18),
                                  // Stacked: product details
                                  _buildDetailCard(context, product),
                                ],
                              );
                      },
                    ),

                    const SizedBox(height: 40),

                    // --- Phần Sản phẩm liên quan (Related products) ---
                    if (_isLoadingRelated || _related.isNotEmpty) ...[
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
                        child: _isLoadingRelated
                            ? const Center(child: CircularProgressIndicator())
                            : _related.isEmpty
                            ? Center(
                                child: Text(
                                  'No related products',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              )
                            : ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: _related.length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 16),
                                itemBuilder: (context, index) {
                                  final p = _related[index];
                                  return SizedBox(
                                    width: 200,
                                    child: ProductCard(
                                      product: p,
                                      onTap: () {
                                        // Dùng pushReplacement để tránh tạo quá nhiều tầng detail screen
                                        Navigator.pushReplacement(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                ProductDetailScreen(product: p),
                                          ),
                                        );
                                      },
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // --- WIDGET MỚI: Image Gallery (Tách ra để căn chỉnh) ---
  Widget _buildImageGallery(List<String> images) {
    return Column(
      children: [
        // Ảnh chính (Page View) - Đảm bảo tỷ lệ 3:4
        AspectRatio(
          aspectRatio: 3 / 4,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: PageView.builder(
              controller: _pageController,
              itemCount: images.length,
              onPageChanged: (i) {
                setState(() => _currentImage = i);
              },
              itemBuilder: (context, i) =>
                  _buildImage(images[i], fit: BoxFit.cover),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Danh sách ảnh nhỏ (Thumbnails)
        SizedBox(
          height: 72,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: images.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final src = images[i];
              final active = i == _currentImage;
              return GestureDetector(
                onTap: () {
                  _pageController.animateToPage(
                    i,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
                child: Container(
                  width: 72, // Đảm bảo kích thước cố định cho thumbnail
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: active ? Colors.blueAccent : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: _buildImage(src, fit: BoxFit.cover),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
  // --------------------------------------------------------

  // --- WIDGET CŨ: Product Details (Đã giữ nguyên) ---
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
            // Quantity selector
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove),
                    onPressed: () {
                      if (_quantity > 1) setState(() => _quantity--);
                    },
                  ),
                  Text('$_quantity', style: const TextStyle(fontSize: 16)),
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () {
                      setState(() => _quantity++);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                // Đã sử dụng hàm _handleAddToCart
                onPressed: _handleAddToCart,
                child: const Text(
                  'Add to cart',
                  style: TextStyle(color: Colors.white),
                ),
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
              onPressed: () {
                // Thêm chức năng Buy Online sau
              },
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

  // --- WIDGET CŨ: Image Builder (Đã giữ nguyên) ---
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

  // --- WIDGET CŨ: Placeholder (Đã giữ nguyên) ---
  Widget _imagePlaceholder() => Container(
    color: Colors.grey.shade100,
    child: const Center(
      child: Icon(Icons.broken_image, size: 56, color: Colors.grey),
    ),
  );
}
