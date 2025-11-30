import 'package:flutter/material.dart';
import '../home_style.dart';
import '../../../models/product.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const ProductCard({super.key, required this.product, this.onTap});

  BorderRadius get _cardBorderRadius => BorderRadius.circular(kCardRadius);

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 2,
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
        child: _buildImageWidget(),
      ),
    );
  }

  Widget _buildImageWidget() {
    if (product.displayImage.isEmpty) {
      return _buildPlaceholder();
    }

    // Check if network image or asset
    final isNetworkImage = product.displayImage.startsWith('http');

    return isNetworkImage
        ? Image.network(
            product.displayImage,
            height: 160,
            width: double.infinity,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) {
                return child;
              }
              return Center(
                child: CircularProgressIndicator(
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
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
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
  }

  Widget _buildHotBadge() {
    return Positioned(
      top: 10,
      left: 10,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
    );
  }

  Widget _buildFavoriteButton() {
    return Positioned(
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
          onPressed: () {
            // TODO: Add to favorites
          },
        ),
      ),
    );
  }

  Widget _buildDiscountBadge() {
    return Positioned(
      top: 8,
      right: 52,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
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
              height: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
        Text(
          '${product.price.toStringAsFixed(0)}₫',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: kPrimaryColor,
          ),
        ),
        if (product.isOnSale && product.originalPrice != null)
          Text(
            '${product.originalPrice!.toStringAsFixed(0)}₫',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[500],
              decoration: TextDecoration.lineThrough,
            ),
          ),
      ],
    );
  }

  Widget _buildCartButton() {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: product.isInStock ? kPrimaryColor : Colors.grey,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Icon(
        product.isInStock
            ? Icons.add_shopping_cart
            : Icons.remove_shopping_cart,
        size: 16,
        color: Colors.white,
      ),
    );
  }

  Widget _buildOutOfStockLabel() {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Text(
        'Hết hàng',
        style: TextStyle(
          fontSize: 11,
          color: Colors.red[400],
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }
}