import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String username = '';
  String email = '';
  String role = '';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      username = prefs.getString('username') ?? prefs.getString('email') ?? 'User';
      email = prefs.getString('email') ?? '';
      role = (prefs.getString('role') ?? 'user').toLowerCase();
    });
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('username');
    await prefs.remove('email');
    await prefs.remove('role');
    // keep 'remembered_email' so login can be prefilled next time
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    final isSeller = role == 'seller';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome, $username',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Email: $email'),
            const SizedBox(height: 8),
            Text('Role: ${role.isEmpty ? 'user' : role}'),
            const SizedBox(height: 20),

            if (isSeller) ...[
              ElevatedButton(
                onPressed: () {
                  // TODO: navigate to seller management screen
                },
                child: const Text('Seller Manager'),
              ),
              const SizedBox(height: 12),
            ],

            // customer actions
            ElevatedButton(
              onPressed: () {
                // TODO: navigate to products screen
              },
              child: const Text('Browse Products'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                // TODO: navigate to cart screen
              },
              child: const Text('View Cart'),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                // TODO: navigate to orders screen
              },
              child: const Text('My Orders'),
            ),
          ],
        ),
      ),
    );
  }
}
