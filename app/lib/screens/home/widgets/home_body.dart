import 'package:flutter/material.dart';

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

  // 👇 Khai báo bộ màu thương hiệu KZONE
  static const Color kzoneBrown = Color(0xFF8B4513);
  static const Color kzoneLightBrown = Color(0xFFD7B9A5);
  static const Color kzoneOrange = Color(0xFFA0522D);
  static const Color kzoneBeige = Color(0xFFFAF7F2);

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
            width: isActive ? 20 : 8, // Chuyển thành dạng thanh dài khi active
            height: 8,
            decoration: BoxDecoration(
              color: isActive ? kzoneBrown : Colors.grey.shade300,
              borderRadius: BorderRadius.circular(4),
            ),
          );
        }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(), // Hiệu ứng cuộn mượt mà
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Banner - Promo strip (Việt hóa)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Material(
                  elevation: 2,
                  borderRadius: BorderRadius.circular(12),
                  color: kzoneBrown,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    child: const Text(
                      '🌟 Mùa đông đã đến! Giảm giá lên tới 60% toàn bộ gian hàng',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white, 
                        fontSize: 13, 
                        fontWeight: FontWeight.w500
                      ),
                    ),
                  ),
                ),
              ),

              // Search Bar (Đồng bộ màu sắc)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Material(
                        elevation: 3,
                        shadowColor: kzoneBrown.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Tìm kiếm sản phẩm...',
                            hintStyle: TextStyle(color: Colors.grey.shade400),
                            prefixIcon: const Icon(Icons.search, color: kzoneBrown),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: kzoneBrown,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: kzoneBrown.withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.filter_list, color: Colors.white),
                        onPressed: () {},
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Hero Banner (Sang trọng hơn)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    width: double.infinity,
                    height: 180,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF8B4513), Color(0xFFC4A484)], // Gradient Nâu
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start, // Đưa text sang trái cho sang
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8, height: 8,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Bộ sưu tập mới',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Định Hình\nPhong Cách',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              height: 1.2,
                            ),
                          ),
                          const Spacer(),
                          SizedBox(
                            height: 36,
                            child: ElevatedButton(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: kzoneBrown,
                                padding: const EdgeInsets.symmetric(horizontal: 24),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                elevation: 0,
                              ),
                              child: const Text(
                                'Khám Phá',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // 👇 KHU VỰC "DÀNH RIÊNG CHO BẠN" VỚI HIỆU ỨNG GLOW AI
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.symmetric(vertical: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: kzoneLightBrown.withValues(alpha: 0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: kzoneBrown.withValues(alpha: 0.04),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    )
                  ],
                ),
                child: Stack(
                  children: [
                    // Hiệu ứng Glow (Ánh sáng mờ) phía sau các sản phẩm
                    Positioned.fill(
                      child: Align(
                        alignment: Alignment.center,
                        child: Container(
                          width: 250,
                          height: 250,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [
                                kzoneLightBrown.withValues(alpha: 0.2),
                                Colors.transparent,
                              ],
                              radius: 0.8,
                            ),
                          ),
                        ),
                      ),
                    ),
                    
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header AI
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: kzoneBrown,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'DÀNH RIÊNG CHO BẠN',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: kzoneBrown,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    Text(
                                      'Tinh chỉnh dựa trên sở thích',
                                      style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
                                    ),
                                  ],
                                ),
                              ),
                              // Badge AI POWERED
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: kzoneOrange,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  'AI POWERED',
                                  style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              )
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 20),

                        // Khối hiển thị Slider Sản phẩm
                        SizedBox(
                          height: 310,
                          child: isLoadingProducts
                              ? const Center(child: CircularProgressIndicator(color: kzoneBrown))
                              : productsError != null
                                  ? _buildErrorState()
                                  : products.isEmpty
                                      ? const Center(child: Text('Chưa có sản phẩm nào'))
                                      : Stack(
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
                                                  left: index == 0 ? 20 : 8,
                                                  right: index < products.length - 1 ? 8 : 20,
                                                ),
                                                child: ProductCard(
                                                  product: products[index],
                                                  onTap: () => onProductTap(products[index]),
                                                ),
                                              ),
                                            ),
                                            // Nút Prev
                                            Positioned(
                                              left: 8,
                                              child: _buildNavButton(Icons.chevron_left, onPrev),
                                            ),
                                            // Nút Next
                                            Positioned(
                                              right: 8,
                                              child: _buildNavButton(Icons.chevron_right, onNext),
                                            ),
                                          ],
                                        ),
                        ),
                        const SizedBox(height: 12),
                        _buildPageIndicator(),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Khối Tính Năng (Dịch sang tiếng Việt)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    FeatureItem(
                      icon: Icons.headset_mic_outlined,
                      title: 'Hỗ Trợ Trực Tuyến',
                      subtitle: 'Đội ngũ chăm sóc 24/7',
                    ),
                    FeatureItem(
                      icon: Icons.local_shipping_outlined,
                      title: 'Miễn Phí Vận Chuyển',
                      subtitle: 'Cho đơn hàng từ 500k',
                    ),
                    FeatureItem(
                      icon: Icons.security_outlined,
                      title: 'Thanh Toán An Toàn',
                      subtitle: 'Momo, VNPay, PayPal',
                    ),
                    FeatureItem(
                      icon: Icons.assignment_return_outlined,
                      title: 'Đổi Trả Dễ Dàng',
                      subtitle: 'Miễn phí trong 7 ngày',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  // Nút mũi tên chuyển Slide
  Widget _buildNavButton(IconData icon, VoidCallback onPressed) {
    return Material(
      color: Colors.white.withValues(alpha: 0.9), // Trắng hơi trong suốt
      elevation: 2,
      shape: const CircleBorder(),
      child: IconButton(
        icon: Icon(icon, color: kzoneBrown),
        onPressed: onPressed,
      ),
    );
  }

  // Trạng thái Lỗi
  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off_rounded, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text(
            'Không thể kết nối máy chủ',
            style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: loadProducts,
            icon: const Icon(Icons.refresh, color: kzoneBrown),
            label: const Text('Thử lại', style: TextStyle(color: kzoneBrown)),
          ),
        ],
      ),
    );
  }
}