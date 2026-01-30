require("dotenv").config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require("socket.io");
const connectDB = require('./config/db');

// Import Models
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Livestream = require('./models/Livestream');

// Kết nối Database
connectDB();

const app = express();
const server = http.createServer(app);

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple Logger
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS' && !req.url.includes("socket.io")) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// ==================== SOCKET.IO LOGIC ====================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Biến lưu số người xem (Key: roomName, Value: count)
const roomViewers = {};

io.on("connection", (socket) => {
  
  // --- CHAT THƯỜNG ---
  socket.on("join_room", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
  });

  socket.on("send_message", async (data) => {
    const { roomId, senderId, text } = data;
    socket.to(roomId).emit("receive_message", data);
    try {
      const [userId, brandId] = roomId.split("-");
      let conversation = await Conversation.findOne({ members: { $all: [userId, brandId] } });
      if (!conversation) {
        conversation = new Conversation({ members: [userId, brandId] });
        await conversation.save();
      } else {
        conversation.updatedAt = Date.now();
        await conversation.save();
      }
      const newMessage = new Message({ conversationId: conversation._id, senderId, text });
      await newMessage.save();
    } catch (err) {
      console.error("❌ Socket Chat Error:", err.message);
    }
  });

  // =======================================================
  // --- 👇 PHẦN LIVESTREAM REAL-TIME (CẬP NHẬT MỚI) 👇 ---
  // =======================================================

  // 1. Join Livestream (Xử lý tách biệt Host và Viewer)
  socket.on("join_livestream", (data) => {
    // data có thể là string (code cũ) hoặc object { roomName, role } (code mới)
    const roomName = typeof data === 'string' ? data : data.roomName;
    const role = typeof data === 'object' ? data.role : 'viewer'; // Mặc định viewer

    if (!roomName) return;
    socket.join(roomName);
    
    // Đánh dấu socket này có phải là viewer không để dùng khi disconnect
    socket.isViewer = (role === 'viewer');

    // CHỈ TĂNG VIEW NẾU LÀ VIEWER
    if (socket.isViewer) {
        if (!roomViewers[roomName]) roomViewers[roomName] = 0;
        roomViewers[roomName]++;
    }
    
    // Gửi cập nhật view
    const currentView = roomViewers[roomName] || 0;
    io.to(roomName).emit("view_count_update", { channelName: roomName, count: currentView });
    io.emit("stream_stats_update", { channelName: roomName, viewers: currentView });
    
    console.log(`📺 ${role.toUpperCase()} joined: ${roomName}. Views: ${currentView}`);
  });

  // 2. Rời Livestream
  socket.on("leave_livestream", (roomName) => {
      socket.leave(roomName);
      
      // Chỉ giảm view nếu là viewer rời đi
      if (socket.isViewer && roomViewers[roomName] > 0) {
          roomViewers[roomName]--;
      }
      
      const currentView = roomViewers[roomName] || 0;
      io.to(roomName).emit("view_count_update", { channelName: roomName, count: currentView });
      io.emit("stream_stats_update", { channelName: roomName, viewers: currentView });
  });

  // 3. Seller bắt đầu Live
  socket.on("seller_start_live", (streamData) => {
      io.emit("stream_started", streamData); 
      console.log("🔥 New Stream Started:", streamData.title);
  });

  // 4. Seller kết thúc Live
  socket.on("end_livestream", (roomName) => {
      io.to(roomName).emit("stream_ended");
      io.emit("stream_ended", roomName);
      if (roomViewers[roomName]) delete roomViewers[roomName]; 
      console.log("❌ Stream Ended:", roomName);
  });

  // 5. Chat & Tim & Ghim
  socket.on("live_chat_message", (data) => io.to(data.streamId).emit("new_comment", data));
  socket.on("send_heart", (roomName) => io.to(roomName).emit("receive_heart"));
  socket.on("pin_product", (data) => io.to(data.streamId).emit("product_pinned", data.product));

  // 6. Xử lý ngắt kết nối đột ngột
  socket.on("disconnecting", () => {
      const rooms = socket.rooms;
      rooms.forEach((room) => {
          // Chỉ xử lý nếu là room livestream và socket là viewer
          if (roomViewers[room] !== undefined && socket.isViewer) { 
              if (roomViewers[room] > 0) roomViewers[room]--;
              
              const currentView = roomViewers[room] || 0;
              io.to(room).emit("view_count_update", { channelName: room, count: currentView });
              io.emit("stream_stats_update", { channelName: room, viewers: currentView });
          }
      });
  });
});

// ==================== REST API ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/brands', require('./routes/brand'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/momo', require('./routes/momo'));
app.use('/api/vnpay', require('./routes/vnpay'));
app.use('/api/seller', require('./routes/seller/seller'));
app.use('/api/seller/products', require('./routes/seller/sellerProducts'));
app.use('/api/seller/orders', require('./routes/seller/sellerOrder'));
app.use('/api/chat', require('./routes/chat')); 
app.use('/api/livestreams', require('./routes/livestream'));

app.get('/', (req, res) => res.send('API is running...'));

app.use((req, res, next) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});