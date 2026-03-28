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
const interactionRoutes = require('./routes/interactions');
const recommendationRoutes = require('./routes/recommendations');

// Kết nối Database
connectDB();

const app = express();
const server = http.createServer(app);

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://10.0.2.2:3000", // Thêm origin cho máy ảo nếu cần
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], 
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

const roomViewers = {};

io.on("connection", (socket) => {
  
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

  socket.on("join_livestream", (data) => {
    const roomName = typeof data === 'string' ? data : data.roomName;
    const role = typeof data === 'object' ? data.role : 'viewer';

    if (!roomName) return;
    socket.join(roomName);
    socket.isViewer = (role === 'viewer');

    if (socket.isViewer) {
        if (!roomViewers[roomName]) roomViewers[roomName] = 0;
        roomViewers[roomName]++;
    }
    
    const currentView = roomViewers[roomName] || 0;
    io.to(roomName).emit("view_count_update", { channelName: roomName, count: currentView });
    io.emit("stream_stats_update", { channelName: roomName, viewers: currentView });
    
    console.log(`📺 ${role.toUpperCase()} joined: ${roomName}. Views: ${currentView}`);
  });

  socket.on("leave_livestream", (roomName) => {
      socket.leave(roomName);
      if (socket.isViewer && roomViewers[roomName] > 0) {
          roomViewers[roomName]--;
      }
      const currentView = roomViewers[roomName] || 0;
      io.to(roomName).emit("view_count_update", { channelName: roomName, count: currentView });
      io.emit("stream_stats_update", { channelName: roomName, viewers: currentView });
  });

  socket.on("seller_start_live", (streamData) => {
      io.emit("stream_started", streamData); 
      console.log("🔥 New Stream Started:", streamData.title);
  });

  socket.on("end_livestream", (roomName) => {
      io.to(roomName).emit("stream_ended");
      io.emit("stream_ended", roomName);
      if (roomViewers[roomName]) delete roomViewers[roomName]; 
      console.log("❌ Stream Ended:", roomName);
  });

  socket.on("live_chat_message", (data) => io.to(data.streamId).emit("new_comment", data));
  socket.on("send_heart", (roomName) => io.to(roomName).emit("receive_heart"));
  socket.on("pin_product", (data) => io.to(data.streamId).emit("product_pinned", data.product));

  socket.on("disconnecting", () => {
      const rooms = socket.rooms;
      rooms.forEach((room) => {
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

app.use("/api/admin/users", require("./routes/admin/accountAdmin"));
app.use("/api/admin/promotions", require("./routes/admin/promotionAdmin"));
app.use("/api/admin/sellers", require("./routes/admin/sellerAdmin"));
app.use("/api/admin/stats", require("./routes/admin/statsAdmin"));

app.use('/api/interactions', interactionRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.get('/', (req, res) => res.send('API is running...'));

app.use((req, res, next) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 👇 THAY ĐỔI QUAN TRỌNG ĐỂ THÔNG MẠNG CHO MÁY ẢO
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server KZONE running on:`);
  console.log(`🏠 Local: http://localhost:${PORT}`);
  console.log(`📱 Emulator (Android): http://10.0.2.2:${PORT}`);
});