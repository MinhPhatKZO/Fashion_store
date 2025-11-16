import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  final String username;
  final String email;

  const ProfileScreen({
    super.key,
    required this.username,
    required this.email,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Profile")),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const CircleAvatar(radius: 50, child: Icon(Icons.person, size: 60)),
            const SizedBox(height: 20),
            Text(username,
                style: const TextStyle(
                    fontSize: 22, fontWeight: FontWeight.bold)),
            Text(email, style: const TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
