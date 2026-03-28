import 'package:flutter/material.dart';

class FeatureItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const FeatureItem({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  // 👇 Khai báo màu thương hiệu
  static const Color kzoneBrown = Color(0xFF8B4513);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: kzoneBrown.withValues(alpha: 0.1), // Nền nâu nhạt sang trọng
              borderRadius: BorderRadius.circular(14), // Bo góc mềm mại hơn
            ),
            child: Icon(icon, size: 28, color: kzoneBrown), // Đổi icon sang Nâu
          ),
          const SizedBox(width: 16),
          // 👇 Bọc Column trong Expanded để tránh lỗi tràn viền (overflow) nếu chữ quá dài
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 13, 
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}