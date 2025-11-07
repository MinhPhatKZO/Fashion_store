import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/auth/welcome_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/admin/admin_screen.dart';
import 'screens/seller/seller_screen.dart';

void main() {
  runApp(const FashionStoreApp());
}

class FashionStoreApp extends StatelessWidget {
  const FashionStoreApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Fashion Store App',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2D5016),
        ),
        fontFamily: 'Inter',
      ),

      /// PAGE FLOW
      initialRoute: '/',
      routes: {
        '/': (_) => const AuthCheck(),
        '/welcome': (_) => const WelcomeScreen(),
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/home': (_) => const HomeScreen(),
        '/admin': (_) => const AdminScreen(),
        '/seller': (_) => const SellerScreen(),
      },
    );
  }
}

class AuthCheck extends StatefulWidget {
  const AuthCheck({super.key});

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  bool loading = true;
  String? role;

  @override
  void initState() {
    super.initState();
    check();
  }

  Future<void> check() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");
    final userRole = prefs.getString("role");

    setState(() {
      role = userRole;
      loading = false;
    });

    if (token == null) {
      // No token, go to welcome
      Navigator.pushReplacementNamed(context, '/welcome');
      return;
    }

    // Navigate based on role
    if (userRole == 'admin') {
      Navigator.pushReplacementNamed(context, '/admin');
    } else if (userRole == 'seller') {
      Navigator.pushReplacementNamed(context, '/seller');
    } else {
      Navigator.pushReplacementNamed(context, '/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    // If no role or no token, go to welcome
    return const WelcomeScreen();
  }
}
