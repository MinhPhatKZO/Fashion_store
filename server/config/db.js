const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ✅ Bỏ các options deprecated
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db'
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// ✅ Lắng nghe các sự kiện MongoDB
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected');
});

module.exports = connectDB;