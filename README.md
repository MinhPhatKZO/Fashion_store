# Fashion Store - E-commerce Application

Dự án ứng dụng thương mại điện tử tích hợp đầy đủ với web app và mobile app cho cửa hàng thời trang.

## 🏗️ Kiến trúc dự án

```
fashion-store/
├── server/          # Backend API (Express.js + MongoDB)
├── web/             # Frontend Web (React + TypeScript)
├── app/             # Mobile App (Flutter)
└── docs/            # Tài liệu dự án
```

## 🚀 Công nghệ sử dụng

### Backend (Server)
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Cloudinary
- **Payment**: Stripe
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

### Frontend Web
- **Framework**: React 18 + TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Yup
- **UI Components**: Custom components
- **Payment**: Stripe Elements

### Mobile App
- **Framework**: Flutter
- **State Management**: Provider + Bloc
- **Navigation**: Go Router
- **HTTP Client**: Dio
- **Local Storage**: Hive + SharedPreferences
- **Image Loading**: Cached Network Image
- **Forms**: Form Validator

## 📦 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- MongoDB >= 5.0
- Flutter >= 3.8.0
- Git

### 1. Clone repository
```bash
git clone <repository-url>
cd fashion-store
```

### 2. Cài đặt Backend
```bash
# Cài đặt dependencies
npm install

# Tạo file .env từ .env.example
cp env.example .env

# Cấu hình các biến môi trường trong .env
# - MONGODB_URI
# - JWT_SECRET
# - CLOUDINARY_* (cho upload ảnh)
# - STRIPE_* (cho thanh toán)
# - EMAIL_* (cho gửi email)

# Chạy server
npm run dev
```

### 3. Cài đặt Web App
```bash
cd web

# Cài đặt dependencies
npm install

# Tạo file .env
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Chạy web app
npm start
```

### 4. Cài đặt Mobile App
```bash
cd app

# Cài đặt dependencies
flutter pub get

# Chạy app
flutter run
```

### 5. Cài đặt tất cả cùng lúc
```bash
# Từ thư mục gốc
npm run install:all

# Chạy tất cả (backend + web)
npm run dev:all
```

## 🗄️ Cấu trúc Database

### Collections chính:
- **users**: Thông tin người dùng
- **products**: Sản phẩm
- **categories**: Danh mục sản phẩm
- **orders**: Đơn hàng
- **reviews**: Đánh giá sản phẩm

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (User/Admin)
- Protected routes và API endpoints
- Password hashing với bcrypt

## 📱 Tính năng chính

### Cho người dùng:
- ✅ Đăng ký/Đăng nhập
- ✅ Duyệt sản phẩm với filter và search
- ✅ Chi tiết sản phẩm
- ✅ Giỏ hàng
- ✅ Thanh toán (Stripe)
- ✅ Quản lý đơn hàng
- ✅ Đánh giá sản phẩm
- ✅ Danh sách yêu thích
- ✅ Quản lý địa chỉ

### Cho admin:
- ✅ Quản lý sản phẩm
- ✅ Quản lý danh mục
- ✅ Quản lý đơn hàng
- ✅ Quản lý người dùng
- ✅ Upload ảnh
- ✅ Thống kê

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user
- `PUT /api/auth/profile` - Cập nhật profile

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `GET /api/products/featured` - Sản phẩm nổi bật
- `POST /api/products` - Tạo sản phẩm (Admin)

### Orders
- `GET /api/orders` - Lấy đơn hàng của user
- `POST /api/orders` - Tạo đơn hàng
- `PUT /api/orders/:id/cancel` - Hủy đơn hàng

### Reviews
- `GET /api/reviews/product/:id` - Đánh giá sản phẩm
- `POST /api/reviews` - Tạo đánh giá
- `PUT /api/reviews/:id` - Cập nhật đánh giá

## 🔧 Scripts có sẵn

### Backend
```bash
npm start          # Chạy production
npm run dev        # Chạy development với nodemon
npm test           # Chạy tests
```

### Web App
```bash
npm start          # Chạy development server
npm run build      # Build cho production
npm test           # Chạy tests
```

### Mobile App
```bash
flutter run        # Chạy app
flutter build apk  # Build APK
flutter build ios  # Build iOS
```

## 📝 Cấu hình môi trường

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fasion_store
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Web App (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 🚀 Deployment

### Backend
- Deploy lên Heroku, Vercel, hoặc DigitalOcean
- Cấu hình MongoDB Atlas
- Cấu hình Cloudinary cho upload ảnh

### Web App
- Deploy lên Vercel, Netlify, hoặc GitHub Pages
- Build static files với `npm run build`

### Mobile App
- Build APK cho Android
- Build IPA cho iOS
- Publish lên Google Play Store và App Store

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Email: minhphatdthw@gmail.com
- Website: https://fashionstore.com

## 🙏 Acknowledgments

- Express.js team
- React team
- Flutter team
- MongoDB team
- Stripe team



