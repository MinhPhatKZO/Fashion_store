import 'package:flutter/material.dart';
import '../../../models/product.dart';
import '../../../services/product_service.dart';
import '../home/widgets/product_card.dart';
import '../product/product_detail_screen.dart';

enum SortOrder { none, priceLowToHigh, priceHighToLow, nameAZ }

class CategoryScreen extends StatefulWidget {
  final String? categoryName;
  final String? categoryId;

  const CategoryScreen({super.key, this.categoryName, this.categoryId});

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  final ProductService _productService = ProductService();
  late Future<List<Product>> _futureProducts;
  SortOrder _sortOrder = SortOrder.none;

  // 👇 Màu sắc KZONE
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  // 🛠️ HÀM FIX LỖI: Kiểm tra nếu ID null thì lấy tất cả, không cố lọc nữa
  Future<void> _loadProducts() async {
    Future<List<Product>> fetchCall;

    if (widget.categoryId == null || widget.categoryId!.isEmpty) {
      // Nếu không có ID -> Gọi lấy toàn bộ sản phẩm
      fetchCall = _productService.getAllProducts();
    } else {
      // Nếu có ID -> Lọc theo danh mục
      fetchCall = _productService.getProductsByCategory(
        categoryId: widget.categoryId,
        categoryName: widget.categoryName,
      );
    }

    _futureProducts = fetchCall.then((products) => _sortProducts(products, _sortOrder));
    setState(() {});
  }

  List<Product> _sortProducts(List<Product> products, SortOrder order) {
    List<Product> sortedList = List.from(products); // Copy list tránh lỗi linter
    sortedList.sort((a, b) {
      switch (order) {
        case SortOrder.priceLowToHigh: return a.price.compareTo(b.price);
        case SortOrder.priceHighToLow: return b.price.compareTo(a.price);
        case SortOrder.nameAZ: return a.name.toLowerCase().compareTo(b.name.toLowerCase());
        case SortOrder.none: return 0;
      }
    });
    return sortedList;
  }

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('SẮP XẾP THEO', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: kzoneBrown)),
              const Divider(),
              _buildSortTile('Mặc định', SortOrder.none),
              _buildSortTile('Giá: Thấp đến Cao', SortOrder.priceLowToHigh),
              _buildSortTile('Giá: Cao xuống Thấp', SortOrder.priceHighToLow),
              _buildSortTile('Tên: A - Z', SortOrder.nameAZ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSortTile(String title, SortOrder order) {
    return ListTile(
      title: Text(title, style: TextStyle(color: _sortOrder == order ? kzoneBrown : Colors.black87, fontWeight: _sortOrder == order ? FontWeight.bold : FontWeight.normal)),
      trailing: _sortOrder == order ? const Icon(Icons.check_circle, color: kzoneBrown) : null,
      onTap: () {
        setState(() { _sortOrder = order; _loadProducts(); });
        Navigator.pop(context);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final String title = widget.categoryId == null ? "TẤT CẢ SẢN PHẨM" : (widget.categoryName ?? "DANH MỤC").toUpperCase();

    return Scaffold(
      backgroundColor: kzoneBeige,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Text(title, style: const TextStyle(color: kzoneBrown, fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1)),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.swap_vert_rounded, color: kzoneBrown), onPressed: _showSortOptions),
          const SizedBox(width: 8),
        ],
      ),
      body: FutureBuilder<List<Product>>(
        future: _futureProducts,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: kzoneBrown));
          }
          if (snapshot.hasError) return Center(child: Text('Lỗi kết nối: ${snapshot.error}'));

          final products = snapshot.data ?? [];
          if (products.isEmpty) return const Center(child: Text('Không tìm thấy sản phẩm nào.'));

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 0.65, // 👇 Tỉ lệ chuẩn cho thẻ ProductCard của bạn
            ),
            itemCount: products.length,
            itemBuilder: (context, index) => ProductCard(
              product: products[index],
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: products[index]))),
            ),
          );
        },
      ),
    );
  }
}