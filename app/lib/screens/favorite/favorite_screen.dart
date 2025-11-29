import 'package:flutter/material.dart';

class FavoriteScreen extends StatelessWidget {
  const FavoriteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Favorites"),
        centerTitle: true,
      ),
      body: const Center(
        child: Text(
          "No favorite products yet!",
          style: TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}
