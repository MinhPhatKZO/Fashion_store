import 'package:flutter/material.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../home/widgets/product_card.dart';
import '../product/product_detail_screen.dart';

class ProductListScreen extends StatefulWidget {
  // Yêu cầu bắt buộc phải có đối tượng Category
  final Category category;

  const ProductListScreen({Key? key, required this.category}) : super(key: key);

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final ProductService _productService = ProductService();
  late Future<List<Product>> _futureProducts;

  @override
  void initState() {
    super.initState();
    // 1. Tải sản phẩm theo ID của Category
    _loadProducts();
  }
  
  // Hàm tải sản phẩm riêng biệt
  void _loadProducts() {
    // Dựa trên giả định rằng getProductsByCategory chấp nhận categoryId (String)
    _futureProducts = _productService.getProductsByCategory(categoryId: widget.category.id);
  }

  // 2. Thêm didUpdateWidget để xử lý trường hợp Category thay đổi
  @override
  void didUpdateWidget(covariant ProductListScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Nếu ID của danh mục hiện tại khác ID danh mục cũ, tải lại sản phẩm
    if (widget.category.id != oldWidget.category.id) {
      setState(() {
        _loadProducts();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Tiêu đề sử dụng tên danh mục
    return Scaffold(
      appBar: AppBar(title: Text(widget.category.name)),
      body: FutureBuilder<List<Product>>(
        future: _futureProducts,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final products = snapshot.data ?? [];
          if (products.isEmpty) {
            return Center(
                child: Text('No products found for ${widget.category.name}.'));
          }

          return GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              // Giữ childAspectRatio như cũ, nhưng 0.6 là rất cao và hẹp, 
              // hãy đảm bảo ProductCard của bạn hiển thị tốt trong tỷ lệ này.
              childAspectRatio: 0.6, 
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