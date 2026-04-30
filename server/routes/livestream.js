const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');
const User = require('../models/User'); 

//  SỬA LẠI: Import đúng tên "auth" thay vì "verifyToken"
const { auth } = require('../middleware/auth'); 

// 1. GET: Lấy danh sách Livestream đang phát
router.get('/', async (req, res) => {
  try {
    const streams = await Livestream.find({ status: 'live' })
      .populate('seller', 'name avatar brandName')
      .sort({ createdAt: -1 });

    const formattedStreams = streams.map(stream => ({
      _id: stream._id,
      title: stream.title,
      thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1470&auto=format&fit=crop",
      viewers: stream.views,
      brandId: stream.seller?._id,
      brandName: stream.seller?.brandName || stream.seller?.name || "Shop",
      avatar: stream.seller?.avatar,
      status: stream.status,
      channelName: stream.agoraChannel
    }));

    res.json(formattedStreams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi Server" });
  }
});

// 2. POST: Tạo phiên Livestream mới
// SỬA LẠI: Dùng middleware "auth" ở đây
router.post('/', auth, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const channelName = `live-${req.user.id}-${Date.now()}`;

    const newStream = new Livestream({
      seller: req.user.id,
      title,
      status: 'live',
      agoraChannel: channelName,
      views: 0,
      likes: 0
    });

    await newStream.save();
    await newStream.populate('seller', 'name avatar brandName');

    res.status(201).json({
      _id: newStream._id,
      title: newStream.title,
      thumbnail: "https://via.placeholder.com/400x600",
      viewers: 0,
      brandId: newStream.seller._id,
      brandName: newStream.seller.brandName || newStream.seller.name,
      avatar: newStream.seller.avatar,
      status: 'live',
      channelName: newStream.agoraChannel
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Không thể tạo Livestream" });
  }
});

// 3. PUT: Kết thúc Livestream
//  SỬA LẠI: Dùng middleware "auth" ở đây
router.put('/end', auth, async (req, res) => {
  try {
    const { channelName } = req.body;
    
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const stream = await Livestream.findOneAndUpdate(
      { agoraChannel: channelName, seller: req.user.id },
      { status: 'ended' },
      { new: true }
    );
    
    if (!stream) return res.status(404).json({ message: "Livestream không tồn tại hoặc không có quyền" });
    
    res.json({ message: "Đã kết thúc Livestream", stream });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;