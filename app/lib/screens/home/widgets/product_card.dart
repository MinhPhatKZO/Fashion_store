import 'package:flutter/material.dart';

// 👇 Sửa đường dẫn để trỏ đúng tới thư mục chứa file product.dart
import '../../../models/product.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  // 👇 Đã sửa lỗi đánh máy this.this.onTap thành this.onTap
  const ProductCard({super.key, required this.product, this.onTap});

  // 👇 Khai báo bộ màu thương hiệu KZONE Central
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneOrange = Color(0xFFA0522D);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

  // 👇 Khai báo biến kCardRadius trực tiếp ở đây
  static const double kCardRadius = 16.0;

  BorderRadius get _cardBorderRadius => BorderRadius.circular(kCardRadius);

  // 👇 Hàm định dạng tiền VNĐ (VD: 1000000 -> 1.000.000₫)
  String _formatCurrency(double price) {
    String priceStr = price.toStringAsFixed(0);
    priceStr = priceStr.replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.');
    return '$priceStr₫';
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 3,
      shadowColor: kzoneBrown.withValues(alpha: 0.1), // Đổ bóng màu nâu nhạt
      borderRadius: _cardBorderRadius,
      color: Colors.white,
      child: InkWell(
        borderRadius: _cardBorderRadius,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageSection(),
            _buildInfoSection(),
          ],
        ),
      ),
    );
  }

  // --- IMAGE SECTION ---
  Widget _buildImageSection() {
    return Stack(
      children: [
        _buildMainImage(),
        if (product.isFeatured) _buildHotBadge(),
        _buildFavoriteButton(),
        if (product.discountPercent != null) _buildDiscountBadge(),
      ],
    );
  }

  Widget _buildMainImage() {
    return Container(
      height: 160,
      width: double.infinity,
      decoration: BoxDecoration(
        color: kzoneBeige, // Đổi màu nền chờ thành màu Beige
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(kCardRadius),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(kCardRadius),
        ),
        child: _buildImageWidget(),
      ),
    );
  }

  Widget _buildImageWidget() {
    if (product.displayImage.isEmpty) {
      return _buildPlaceholder();
    }

    final isNetworkImage = product.displayImage.startsWith('http');

    return isNetworkImage
        ? Image.network(
            product.displayImage,
            height: 160,
            width: double.infinity,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Center(
                child: CircularProgressIndicator(
                  color: kzoneBrown, // Đổi màu loading
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                      : null,
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
          )
        : Image.asset(
            product.displayImage,
            height: 160,
            width: double.infinity,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
          );
  }

  Widget _buildPlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_bag_outlined, size: 40, color: kzoneBrown.withValues(alpha: 0.5)),
          const SizedBox(height: 4),
          Text(
            'KZONE',
            style: TextStyle(
              fontSize: 10, 
              color: kzoneBrown.withValues(alpha: 0.5),
              fontWeight: FontWeight.bold,
              letterSpacing: 1
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHotBadge() {
    return Positioned(
      top: 10,
      left: 10,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: kzoneOrange, // Màu Nâu Cam nổi bật
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text(
          'MỚI', // Việt hóa
          style: TextStyle(
            color: Colors.white,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  Widget _buildFavoriteButton() {
    return Positioned(
      top: 8,
      right: 8,
      child: Material(
        color: Colors.white.withValues(alpha: 0.9),
        shape: const CircleBorder(),
        child: IconButton(
          icon: const Icon(
            Icons.favorite_border_rounded,
            size: 18,
            color: kzoneOrange, // Đổi từ đỏ sang Nâu Cam
          ),
          onPressed: () {
            // Logic cho yêu thích sau này sẽ code ở đây
          },
        ),
      ),
    );
  }

  Widget _buildDiscountBadge() {
    return Positioned(
      top: 8,
      right: 48,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black87, // Màu đen sang trọng cho % giảm giá
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
    );
  }

  // --- INFO SECTION ---
  Widget _buildInfoSection() {
    return Padding(
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
              color: Colors.black87,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(child: _buildPriceSection()),
              _buildCartButton(),
            ],
          ),
          if (!product.isInStock) _buildOutOfStockLabel(),
        ],
      ),
    );
  }

  Widget _buildPriceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (product.isOnSale && product.originalPrice != null)
          Text(
            _formatCurrency(product.originalPrice!),
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[500],
              decoration: TextDecoration.lineThrough,
            ),
          ),
        Text(
          _formatCurrency(product.price),
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: kzoneBrown, // Giá tiền màu Nâu
          ),
        ),
      ],
    );
  }

  Widget _buildCartButton() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: product.isInStock ? kzoneBrown : Colors.grey.shade300,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        product.isInStock
            ? Icons.shopping_bag_outlined // Đổi icon sang giỏ xách cho thời trang
            : Icons.remove_shopping_cart_outlined,
        size: 16,
        color: product.isInStock ? Colors.white : Colors.grey.shade500,
      ),
    );
  }

  Widget _buildOutOfStockLabel() {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Text(
        'Tạm hết hàng',
        style: TextStyle(
          fontSize: 11,
          color: Colors.red[400],
          fontStyle: FontStyle.italic,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}