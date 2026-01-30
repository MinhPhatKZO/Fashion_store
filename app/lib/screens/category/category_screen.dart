import 'package:flutter/material.dart';
import '../../../models/product.dart';
import '../../../services/product_service.dart';
import '../home/widgets/product_card.dart';
import '../product/product_detail_screen.dart';

// Định nghĩa Enum cho các tùy chọn sắp xếp
enum SortOrder { 
  none, 
  priceLowToHigh, 
  priceHighToLow, 
  nameAZ, 
}

class CategoryScreen extends StatefulWidget {
  final String? categoryName; // Tên danh mục để hiển thị và có thể lọc
  final String? categoryId;  // ID danh mục để lọc chính xác

  const CategoryScreen({
    super.key,
    this.categoryName,
    this.categoryId,
  });

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  final ProductService _productService = ProductService();
  late Future<List<Product>> _futureProducts;

  // Trạng thái cho Sắp xếp và Lọc
  SortOrder _sortOrder = SortOrder.none;
  // Bạn có thể thêm Map cho các bộ lọc phức tạp hơn (e.g., brand, color, size)
  final Map<String, String> _filterParams = {}; 

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  // Hàm tải sản phẩm có tính đến trạng thái sắp xếp/lọc
  Future<void> _loadProducts() async {
    // 1. Lấy sản phẩm dựa trên Category ID
    _futureProducts = _productService.getProductsByCategory(
      categoryId: widget.categoryId,
      categoryName: widget.categoryName,
    ).then((products) {
      // 2. Sắp xếp danh sách sản phẩm sau khi lấy về
      return _sortProducts(products, _sortOrder);
    });
    // Kích hoạt lại setState để FutureBuilder cập nhật
    setState(() {});
  }
  
  // Hàm sắp xếp (Client-side sorting)
  List<Product> _sortProducts(List<Product> products, SortOrder order) {
    products.sort((a, b) {
      switch (order) {
        case SortOrder.priceLowToHigh:
          return a.price.compareTo(b.price);
        case SortOrder.priceHighToLow:
          return b.price.compareTo(a.price);
        case SortOrder.nameAZ:
          return a.name.toLowerCase().compareTo(b.name.toLowerCase());
        case SortOrder.none:
        default:
          return 0;
      }
    });
    return products;
  }
  
  // Hiển thị tùy chọn sắp xếp
  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Sort By',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
            const Divider(height: 1),
            ...SortOrder.values.map((order) {
              String title;
              switch (order) {
                case SortOrder.priceLowToHigh:
                  title = 'Price: Low to High';
                  break;
                case SortOrder.priceHighToLow:
                  title = 'Price: High to Low';
                  break;
                case SortOrder.nameAZ:
                  title = 'Name: A-Z';
                  break;
                case SortOrder.none:
                  title = 'None (Default)';
                  break;
              }
              return ListTile(
                title: Text(title),
                trailing: _sortOrder == order ? const Icon(Icons.check) : null,
                onTap: () {
                  setState(() {
                    _sortOrder = order;
                    _loadProducts(); // Tải lại (sắp xếp) sản phẩm
                  });
                  Navigator.pop(context);
                },
              );
            }),
          ],
        );
      },
    );
  }


  // Cập nhật lại Future nếu tham số Category thay đổi
  @override
  void didUpdateWidget(covariant CategoryScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.categoryId != oldWidget.categoryId) {
      _loadProducts(); // Tải lại sản phẩm
    }
  }

  @override
  Widget build(BuildContext context) {
    // Hiển thị tên danh mục trên AppBar
    final String title = widget.categoryName != null && widget.categoryName!.isNotEmpty
        ? widget.categoryName!
        : "All Products";

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        centerTitle: true,
        // THÊM NÚT SẮP XẾP VÀ BỘ LỌC
        actions: [
          // Nút Sắp xếp
          IconButton(
            icon: const Icon(Icons.sort),
            onPressed: _showSortOptions,
          ),
          // Nút Bộ lọc (Chưa triển khai logic phức tạp)
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // TODO: Triển khai _showFilterOptions cho lọc Brand, Size, etc.
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Filter options coming soon!')),
              );
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
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
              child: Text('No products found for ${widget.categoryName ?? 'this category'}.'),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 3, // dọc
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
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