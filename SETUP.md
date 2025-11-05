# Hướng dẫn cài đặt Fashion Store

## 🚀 Cài đặt nhanh

### 1. Cài đặt Backend
```bash
# Cài đặt dependencies
npm install

# Tạo file .env từ env.example
cp env.example .env

# Cấu hình MongoDB (cài đặt MongoDB nếu chưa có)
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb

# Chạy MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod

# Chạy backend server
npm run dev
```

### 2. Cài đặt Web App
```bash
cd web

# Cài đặt dependencies
npm install

# Tạo file .env
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
echo "REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key" >> .env

# Chạy web app
npm start
```

### 3. Cài đặt Mobile App
```bash
cd app

# Cài đặt dependencies
flutter pub get

# Chạy app (cần có device hoặc emulator)
flutter run
```

## 🔧 Cấu hình chi tiết

### Backend (.env)
Cần cấu hình các dịch vụ bên ngoài:

#### 1. Cloudinary (Upload ảnh)
- Đăng ký tại: https://cloudinary.com
- Lấy thông tin từ Dashboard
- Cập nhật vào .env:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 2. Stripe (Thanh toán)
- Đăng ký tại: https://stripe.com
- Lấy keys từ Dashboard
- Cập nhật vào .env:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 3. Email (Gmail)
- Bật 2FA cho Gmail
- Tạo App Password
- Cập nhật vào .env:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Web App (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🗄️ Database Setup

### MongoDB
1. Cài đặt MongoDB
2. Tạo database `fasion_store`
3. Cấu hình connection string trong .env

### Tạo dữ liệu mẫu
```bash
# Chạy script tạo dữ liệu mẫu (sẽ tạo sau)
npm run seed
```

## 🚀 Chạy tất cả cùng lúc

```bash
# Từ thư mục gốc
npm run install:all  # Cài đặt tất cả dependencies
npm run dev:all      # Chạy backend + web cùng lúc
```

## 📱 Mobile App Setup

### Android
1. Cài đặt Android Studio
2. Tạo AVD (Android Virtual Device)
3. Chạy `flutter run`

### iOS (chỉ trên macOS)
1. Cài đặt Xcode
2. Mở iOS Simulator
3. Chạy `flutter run`

## 🔍 Kiểm tra cài đặt

### Backend
- Truy cập: http://localhost:5000/api/health
- Kết quả mong đợi: `{"status":"OK","message":"Fashion Store API is running"}`

### Web App
- Truy cập: http://localhost:3000
- Trang chủ Fashion Store sẽ hiển thị

### Mobile App
- App sẽ mở trên device/emulator
- Có thể test các tính năng cơ bản

## 🐛 Troubleshooting

### Lỗi MongoDB connection
```bash
# Kiểm tra MongoDB có chạy không
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod
```

### Lỗi port đã được sử dụng
```bash
# Thay đổi port trong .env
PORT=5001  # Thay vì 5000
```

### Lỗi Flutter dependencies
```bash
cd app
flutter clean
flutter pub get
```

### Lỗi React dependencies
```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Tất cả services đã chạy chưa (MongoDB, Node.js, Flutter)
2. Ports không bị conflict
3. Dependencies đã cài đặt đầy đủ
4. File .env đã cấu hình đúng

## 🎯 Bước tiếp theo

Sau khi cài đặt thành công:
1. Tạo tài khoản admin
2. Thêm sản phẩm mẫu
3. Test các tính năng
4. Customize theo nhu cầu


