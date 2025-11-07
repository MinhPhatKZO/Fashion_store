import 'package:flutter/material.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFBEEAFF),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "FashNova",
              style: TextStyle(fontSize: 38, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 20),
            Image.asset("assets/intro.png", height: 180),
            const SizedBox(height: 32),
            const Text("Let’s talk with new friends",
                style: TextStyle(fontSize: 15)),
            const SizedBox(height: 40),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                fixedSize: const Size(180, 44),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.pushNamed(context, "/login");
              },
              child: const Text("Get Started"),
            )
          ],
        ),
      ),
    );
  }
}
