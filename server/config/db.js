const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fasion_store',
      options
    );

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`Database: ${conn.connection.db.databaseName}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('Mongoose reconnected to MongoDB');
    });
    
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.log('\nKhắc phục:');
    console.log('1. Kiểm tra MongoDB đang chạy: net start | findstr MongoDB');
    console.log('2. Khởi động MongoDB: net start MongoDB');
    console.log('3. Kiểm tra URI:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fasion_store');
    process.exit(1);
  }
};

module.exports = connectDB;
