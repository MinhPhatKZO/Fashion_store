import 'package:flutter/material.dart';
import '../home/home_style.dart';
class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Favorites', style: kSectionTitleStyle),
          const SizedBox(height: 12),
          const Text('Your favorite products will appear here.'),
          const SizedBox(height: 12),
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.favorite_border, size: 48, color: Colors.grey),
                  SizedBox(height: 8),
                  Text('No favorites yet'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
