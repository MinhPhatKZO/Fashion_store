# TODO: Implement Authentication and Role-Based Navigation

## Backend Updates
- [x] Update server/models/User.js: Add 'seller' to role enum
- [x] Update server/middleware/auth.js: Fix JWT decoding to use decoded.id
- [x] Update server/routes/auth.js: Ensure login returns user data correctly

## Frontend Updates
- [x] Update app/lib/services/auth_service.dart: Change register to send 'name', update login to return full response
- [x] Update app/lib/screens/login_screen.dart: Add controllers, call auth.login, save token/user data to SharedPreferences, navigate based on role
- [x] Update app/lib/main.dart: Add routes for /admin and /seller, modify AuthCheck to load role and navigate accordingly
- [x] Create app/lib/screens/admin_screen.dart: Basic admin screen
- [x] Create app/lib/screens/seller_screen.dart: Basic seller screen
- [x] Update app/lib/screens/home_screen.dart: Adjust for customer role, add seller options if needed

## Testing
- [ ] Test login/register with different roles
- [ ] Ensure navigation works correctly
