const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

// Kết nối database
connectDB();

const app = express();

// Middleware
app.use(cors()); // cho phép CORS
app.use(express.json()); // parse JSON body
app.use(express.urlencoded({ extended: true })); // parse urlencoded body

// Static folder (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== Routes ====================
// Auth
app.use('/api/auth', require('./routes/auth'));

// Categories
app.use('/api/categories', require('./routes/categories'));

// Products
app.use('/api/products', require('./routes/products'));

// Orders
app.use('/api/orders', require('./routes/orders'));

// Reviews
app.use('/api/reviews', require('./routes/reviews'));

// Users
app.use('/api/users', require('./routes/users'));

// Upload
app.use('/api/upload', require('./routes/upload'));

// Admin
app.use('/api/admin', require('./routes/admin'));

// MoMo Payment API
app.use('/api/momo', require('./routes/momo')); // route mới cho MoMo

// ==================== Error Handling ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ==================== Server ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
