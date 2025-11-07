import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool hide = true;
  bool loading = false;

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  final AuthService auth = AuthService();

  @override
  void initState() {
    super.initState();
    _loadRememberedEmail();
  }

  Future<void> _loadRememberedEmail() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberedEmail = prefs.getString('remembered_email');
    if (rememberedEmail != null) {
      emailController.text = rememberedEmail;
    }
  }

  Future<void> handleLogin() async {
    if (emailController.text.trim().isEmpty || passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng điền đầy đủ thông tin')),
      );
      return;
    }

    setState(() => loading = true);

    try {
      final res = await auth.login(
        emailController.text.trim(),
        passwordController.text.trim(),
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', res['token']);
      await prefs.setString('username', res['user']['name']);
      await prefs.setString('email', res['user']['email']);
      await prefs.setString('role', res['user']['role']);

      setState(() => loading = false);

      // Navigate based on role
      final role = res['user']['role'];
      if (role == 'admin') {
        Navigator.pushReplacementNamed(context, '/admin');
      } else if (role == 'seller') {
        Navigator.pushReplacementNamed(context, '/seller');
      } else {
        Navigator.pushReplacementNamed(context, '/home');
      }
    } catch (e) {
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFBEEAFF),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("Login Now",
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w600)),
            const SizedBox(height: 30),
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: "Email",
                border: UnderlineInputBorder(),
              ),
            ),
            TextField(
              controller: passwordController,
              obscureText: hide,
              decoration: InputDecoration(
                labelText: "Password",
                border: const UnderlineInputBorder(),
                suffixIcon: IconButton(
                  icon: Icon(hide ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => hide = !hide),
                ),
              ),
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                fixedSize: const Size(160, 42),
              ),
              onPressed: loading ? null : handleLogin,
              child: loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text("Login"),
            ),
            const SizedBox(height: 16),
            const Text("Or login with"),
            const SizedBox(height: 14),
            socialButton("Login with Facebook"),
            const SizedBox(height: 10),
            socialButton("Login with Google"),
            const SizedBox(height: 25),
            GestureDetector(
              onTap: () => Navigator.pushNamed(context, "/register"),
              child: const Text("Don’t have an account ? Register"),
            )
          ],
        ),
      ),
    );
  }

  Widget socialButton(String text) {
    return Container(
      height: 38,
      width: 200,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text),
    );
  }
}
