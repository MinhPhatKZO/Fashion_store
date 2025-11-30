const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// ==================== LOAD .env ====================
// File .env nằm ở thư mục gốc project
dotenv.config({ path: path.join(__dirname, '..', '.env') });
console.log('✅ .env loaded successfully');

// ==================== CHECK MoMo CONFIG ====================
const requiredMomoEnv = [
  'MOMO_PARTNER_CODE',
  'MOMO_ACCESS_KEY',
  'MOMO_SECRET_KEY',
  'MOMO_REDIRECT_URL',
  'MOMO_IPN_URL',
];

const missingMomoEnv = requiredMomoEnv.filter(
  (key) => !process.env[key] || process.env[key].trim() === ''
);

if (missingMomoEnv.length > 0) {
  console.error(`❌ MoMo config missing: ${missingMomoEnv.join(', ')}`);
  console.error('❌ MoMo thanh toán sẽ KHÔNG hoạt động!');
} else {
  console.log('✅ MoMo config loaded OK');
}

// ==================== CHECK VNPAY CONFIG ====================
const requiredVnpayEnv = [
  'VNP_TMNCODE',
  'VNP_HASHSECRET',
  'VNP_URL',
  'VNP_RETURNURL',
];

const missingVnpayEnv = requiredVnpayEnv.filter(
  (key) => !process.env[key] || process.env[key].trim() === ''
);

if (missingVnpayEnv.length > 0) {
  console.warn(`⚠️ VNPAY config missing: ${missingVnpayEnv.join(', ')}`);
} else {
  console.log('✅ VNPAY config loaded OK');
}

// ==================== CONNECT MONGODB ====================
console.log('🔹 Connecting to MongoDB:', process.env.MONGODB_URI);
connectDB();

// ==================== INIT EXPRESS ====================
const app = express();

// Logger middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Body parser + CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/brands', require('./routes/brand'));
app.use('/api/orders', require('./routes/orders'));

// Payment routes
app.use('/api/momo', require('./routes/momo'));
app.use('/api/vnpay', require('./routes/vnpay'));

// Seller routes
app.use('/api/seller/products', require('./routes/seller/sellerProducts'));
app.use('/api/seller/orders', require('./routes/seller/sellerOrder'));
app.use('/api/seller', require('./routes/seller/seller'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
