const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { auth } = require("../middleware/auth");

// --- IMPORT MODELS ---
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Brand = require("../models/Brands");

/* ===========================================
   1. API LẤY TIN NHẮN
=========================================== */
router.get("/messages", auth, async (req, res) => {
  try {
    const { userId, brandId } = req.query;

    if (!userId || !brandId) {
      return res.status(400).json({ message: "Missing userId or brandId" });
    }

    const conversation = await Conversation.findOne({
      members: { $all: [userId, brandId] },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (err) {
    console.error("API Messages Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


/* ===========================================
   2. API DANH SÁCH CHAT (SELLER)
=========================================== */
router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Chỉ cho seller
    if (currentUser.role !== "seller") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Phải có brandId
    if (!currentUser.brandId) {
      return res.status(400).json({ message: "Seller chưa có shop (brand)" });
    }

    const brandId = currentUser.brandId.toString();

    // Lấy danh sách conversation
    const conversations = await Conversation.find({
      members: { $in: [brandId] },
    }).sort({ updatedAt: -1 });

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const customerId = conv.members.find(m => m !== brandId);

        const customer = await User.findById(customerId)
          .select("name avatar email");

        const lastMessage = await Message.findOne({
          conversationId: conv._id
        }).sort({ createdAt: -1 });

        return {
          conversationId: conv._id,
          user: customer || null,
          lastMessage: lastMessage?.text || "",
          updatedAt: conv.updatedAt
        };
      })
    );

    res.json(results);

  } catch (err) {
    console.error("API Conversations Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;