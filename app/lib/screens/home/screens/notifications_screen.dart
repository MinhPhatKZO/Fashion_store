import 'package:flutter/material.dart';
import '../home_style.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Notifications', style: kSectionTitleStyle),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.separated(
              itemCount: 5,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (context, i) => ListTile(
                leading: const Icon(Icons.notifications_none),
                title: Text('Notification ${i + 1}'),
                subtitle: const Text('Short description or summary for the notification.'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
