import 'package:flutter/material.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../home/widgets/product_card.dart';
import '../product/product_detail_screen.dart';

class ProductListScreen extends StatefulWidget {
  final Category category;

  const ProductListScreen({super.key, required this.category});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final ProductService _productService = ProductService();
  late Future<List<Product>> _futureProducts;

  // 👇 Khai báo bộ màu KZONE Central
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }
  
  void _loadProducts() {
    _futureProducts = _productService.getProductsByCategory(categoryId: widget.category.id);
  }

  @override
  void didUpdateWidget(covariant ProductListScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.category.id != oldWidget.category.id) {
      setState(() {
        _loadProducts();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kzoneBeige, // Nền Beige đồng bộ
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        shadowColor: kzoneBrown.withValues(alpha: 0.1),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: kzoneBrown, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.category.name.toUpperCase(), // Viết hoa tên danh mục cho sang trọng
          style: const TextStyle(
            color: kzoneBrown,
            fontSize: 18,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.0,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: kzoneBrown, size: 26),
            onPressed: () {
              // TODO: Chuyển sang trang tìm kiếm
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: FutureBuilder<List<Product>>(
        future: _futureProducts,
        builder: (context, snapshot) {
          // Trạng thái: Đang tải
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: kzoneBrown),
            );
          }
          
          // Trạng thái: Báo lỗi mạng/server
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline_rounded, size: 64, color: Colors.red.shade300),
                  const SizedBox(height: 16),
                  Text(
                    'Đã xảy ra lỗi khi tải dữ liệu',
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade700, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: () => setState(() => _loadProducts()),
                    icon: const Icon(Icons.refresh_rounded, size: 20),
                    label: const Text('Thử lại'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kzoneBrown,
                      foregroundColor: Colors.white,
                    ),
                  )
                ],
              ),
            );
          }

          final products = snapshot.data ?? [];
          
          // Trạng thái: Danh mục trống (Chưa có sản phẩm)
          if (products.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inventory_2_outlined, size: 80, color: kzoneBrown.withValues(alpha: 0.3)),
                  const SizedBox(height: 16),
                  Text(
                    'Chưa có sản phẩm nào',
                    style: TextStyle(
                      fontSize: 18, 
                      color: kzoneBrown.withValues(alpha: 0.8),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Các sản phẩm "${widget.category.name}" sẽ sớm được cập nhật.',
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                ],
              ),
            );
          }

          // Trạng thái: Thành công - Hiện lưới sản phẩm
          return GridView.builder(
            physics: const BouncingScrollPhysics(), // Hiệu ứng cuộn nảy mượt mà
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              // 👇 Chỉnh tỷ lệ khung hình thành 0.65 để ProductCard có đủ không gian hiển thị (tránh bị lỗi Overflow chữ)
              childAspectRatio: 0.65, 
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return ProductCard(
                product: product,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ProductDetailScreen(product: product),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}