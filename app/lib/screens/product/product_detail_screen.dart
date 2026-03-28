import 'package:flutter/material.dart';

import '../../models/product.dart';
import '../../services/cart_service.dart';
import '../../services/product_service.dart';
import '../home/widgets/product_card.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({super.key, required this.product});

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

  // 👇 Màu sắc thương hiệu KZONE
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneOrange = Color(0xFFA0522D);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

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
    setState(() => _isLoadingRelated = true);
    try {
      final list = await _productService.getAllProducts(limit: 8);
      final filtered = list.where((p) => p.id != widget.product.id).toList();
      if (mounted) {
        setState(() {
          _related = filtered;
          _isLoadingRelated = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingRelated = false);
    }
  }

  // 👇 Hàm định dạng tiền VNĐ chuẩn
  String _formatCurrency(double price) {
    String priceStr = price.toStringAsFixed(0);
    priceStr = priceStr.replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.');
    return '$priceStr₫';
  }

  void _handleAddToCart() async {
    await CartService.instance.add(widget.product, quantity: _quantity);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text('Đã thêm $_quantity x ${widget.product.name} vào giỏ!')),
            ],
          ),
          backgroundColor: kzoneBrown,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final images = product.fullImageUrls.isNotEmpty
        ? product.fullImageUrls
        : [product.displayImage];

    return Scaffold(
      backgroundColor: kzoneBeige,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: kzoneBrown, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'CHI TIẾT SẢN PHẨM',
          style: TextStyle(color: kzoneBrown, fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1),
        ),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.share_outlined, color: kzoneBrown), onPressed: () {}),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 👇 Khu vực ảnh sản phẩm (Slider)
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Column(
                  children: [
                    _buildImageGallery(images),
                    const SizedBox(height: 16),
                    _buildImageDots(images.length),
                  ],
                ),
              ),

              // 👇 Khu vực thông tin chi tiết
              Container(
                padding: const EdgeInsets.all(24),
                decoration: const BoxDecoration(
                  color: kzoneBeige,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDetailCard(context, product),
                    const SizedBox(height: 40),
                    
                    // 👇 Khu vực sản phẩm liên quan
                    if (_isLoadingRelated || _related.isNotEmpty) ...[
                      const Row(
                        children: [
                          Icon(Icons.auto_awesome, color: kzoneBrown, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'SẢN PHẨM TƯƠNG TỰ',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: kzoneBrown, letterSpacing: 0.5),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildRelatedList(),
                    ],
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      // 👇 Thanh điều hướng mua hàng cố định ở dưới
      bottomNavigationBar: _buildBottomAction(),
    );
  }

  Widget _buildImageGallery(List<String> images) {
    return AspectRatio(
      aspectRatio: 1, // Ảnh vuông cho thời trang chuyên nghiệp
      child: PageView.builder(
        controller: _pageController,
        itemCount: images.length,
        onPageChanged: (i) => setState(() => _currentImage = i),
        itemBuilder: (context, i) => Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: _buildImage(images[i]),
          ),
        ),
      ),
    );
  }

  Widget _buildImageDots(int count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        bool active = i == _currentImage;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: active ? 24 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: active ? kzoneBrown : Colors.grey.shade300,
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }

  Widget _buildDetailCard(BuildContext context, Product product) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                product.name,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black87, height: 1.2),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: kzoneOrange, borderRadius: BorderRadius.circular(10)),
              child: const Text('New Arrival', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
            )
          ],
        ),
        const SizedBox(height: 12),
        Text(
          _formatCurrency(product.price),
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: kzoneBrown),
        ),
        const SizedBox(height: 20),
        const Text(
          'MÔ TẢ SẢN PHẨM',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey, letterSpacing: 1),
        ),
        const SizedBox(height: 8),
        Text(
          product.description,
          style: TextStyle(color: Colors.grey.shade800, height: 1.6, fontSize: 15),
        ),
      ],
    );
  }

  Widget _buildRelatedList() {
    return SizedBox(
      height: 280,
      child: _isLoadingRelated
          ? const Center(child: CircularProgressIndicator(color: kzoneBrown))
          : ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: _related.length,
              separatorBuilder: (_, __) => const SizedBox(width: 16),
              itemBuilder: (context, index) {
                final p = _related[index];
                return SizedBox(
                  width: 180,
                  child: ProductCard(
                    product: p,
                    onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p))),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, -5))],
      ),
      child: Row(
        children: [
          // 👇 Bộ chọn số lượng
          Container(
            decoration: BoxDecoration(
              color: kzoneBeige,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Row(
              children: [
                IconButton(icon: const Icon(Icons.remove, color: kzoneBrown), onPressed: () { if (_quantity > 1) setState(() => _quantity--); }),
                Text('$_quantity', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kzoneBrown)),
                IconButton(icon: const Icon(Icons.add, color: kzoneBrown), onPressed: () => setState(() => _quantity++)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // 👇 Nút thêm vào giỏ hàng
          Expanded(
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: kzoneBrown,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
              onPressed: _handleAddToCart,
              child: const Text('THÊM VÀO GIỎ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 1)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImage(String src) {
    return src.startsWith('http')
        ? Image.network(src, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _imagePlaceholder())
        : Image.asset(src, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _imagePlaceholder());
  }

  Widget _imagePlaceholder() => Container(
        color: kzoneBeige,
        child: const Center(child: Icon(Icons.broken_image, size: 56, color: Colors.grey)),
      );
}