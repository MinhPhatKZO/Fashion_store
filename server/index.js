const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ==================== Load env.example ====================
const envPath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  console.error(`❌ File env.example không tồn tại tại: ${envPath}`);
  process.exit(1);
}

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load env.example:', result.error);
  process.exit(1);
} else {
  console.log('✅ env.example loaded successfully');
}

// ==================== Kiểm tra MoMo config ====================
const requiredMomoEnv = ['MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY', 'MOMO_REDIRECT_URL', 'MOMO_IPN_URL'];
const missingMomoEnv = requiredMomoEnv.filter(key => !process.env[key]);

if (missingMomoEnv.length > 0) {
  console.error(`❌ MoMo config missing: ${missingMomoEnv.join(', ')}`);
  console.error('❌ Please add these variables to env.example');
  console.error('❌ MoMo payment will NOT work!');
} else {
  console.log('✅ MoMo config loaded:', {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    hasAccessKey: !!process.env.MOMO_ACCESS_KEY,
    hasSecretKey: !!process.env.MOMO_SECRET_KEY,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    ipnUrl: process.env.MOMO_IPN_URL
  });
}

// ==================== Kiểm tra VNPAY config ====================
const requiredVnpayEnv = ['VNP_TMNCODE', 'VNP_HASHSECRET', 'VNP_URL', 'VNP_RETURNURL'];
const missingVnpayEnv = requiredVnpayEnv.filter(key => !process.env[key]);

if (missingVnpayEnv.length > 0) {
  console.warn(`⚠️ VNPAY config missing: ${missingVnpayEnv.join(', ')}`);
  console.warn('⚠️ VNPAY payment will not work until you set these variables in .env');
}

// ==================== Kết nối MongoDB ====================
console.log('🔹 Connecting to MongoDB at:', process.env.MONGODB_URI);
connectDB();

// ==================== Khởi tạo Express ====================
const app = express();

// ==================== Middleware ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== Routes ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));

// Payment APIs
app.use('/api/momo', require('./routes/momo'));
app.use('/api/vnpay', require('./routes/vnpay'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ==================== Error Handling ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ==================== Start server ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});