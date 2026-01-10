require("dotenv").config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

// ==================== IMPORT MODELS (FIX) ====================
// Đảm bảo file nằm đúng tại: server/models/Conversation.js
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// --- DEBUG IMPORT ---
console.log("-----------------------------------------");
console.log("🛠 KIỂM TRA IMPORT MODEL:");
// Nếu in ra undefined -> Sai đường dẫn file
// Nếu in ra {} -> Sai cú pháp module.exports trong file model
console.log("👉 Conversation:", Conversation?.modelName ? "✅ OK" : "❌ LỖI (Kiểm tra file models/Conversation.js)");
console.log("👉 Message:     ", Message?.modelName ? "✅ OK" : "❌ LỖI (Kiểm tra file models/Message.js)");
console.log("-----------------------------------------");
// =============================================================

// Kết nối DB
console.log("Gemini Key:", process.env.GEMINI_API_KEY ? "Loaded" : "Missing");
connectDB();

const app = express();
const server = http.createServer(app);

// Cấu hình Socket
const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger
app.use((req, res, next) => {
  if (!req.url.includes("socket.io")) {
    console.log(`[${req.method}] ${req.url}`);
  }
  next();
});

// ==================== SOCKET.IO LOGIC ====================
io.on("connection", (socket) => {
  console.log(`✅ Socket Connected: ${socket.id}`);

  // 1. Join Room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  // 2. Send Message
  socket.on("send_message", async (data) => {
    console.log(`📩 Chat [${data.roomId}]: ${data.text}`);
    socket.to(data.roomId).emit("receive_message", data);

    try {
      // ⚠️ KIỂM TRA LẠI MODEL TRƯỚC KHI DÙNG
      if (!Conversation || !Conversation.findOne) {
        throw new Error("Model Conversation chưa được load! Kiểm tra file models.");
      }

      const [userId, brandId] = data.roomId.split("-");

      let conversation = await Conversation.findOne({
        members: { $all: [userId, brandId] },
      });

      if (!conversation) {
        conversation = new Conversation({ members: [userId, brandId] });
        await conversation.save();
        console.log("--- Tạo cuộc hội thoại mới ---");
      } else {
        conversation.updatedAt = Date.now();
        await conversation.save();
      }

      const newMessage = new Message({
        conversationId: conversation._id,
        senderId: data.senderId,
        text: data.text,
      });
      await newMessage.save();
      console.log("✅ Đã lưu tin nhắn vào DB");
      
    } catch (err) {
      console.error("❌ Lỗi lưu tin nhắn:", err.message);
    }
  });

  socket.on("disconnect", () => {});
});

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
app.use('/api/momo', require('./routes/momo'));
app.use('/api/vnpay', require('./routes/vnpay'));
app.use('/api/seller/products', require('./routes/seller/sellerProducts'));
app.use('/api/seller/orders', require('./routes/seller/sellerOrder'));
app.use('/api/seller', require('./routes/seller/seller'));
app.use('/api/chat', require('./routes/chat')); 

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server & Socket.io running on port ${PORT}`);
});