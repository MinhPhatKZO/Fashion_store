const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { auth } = require("../middleware/auth");

// --- IMPORT MODELS ---
const Conversation = mongoose.models.Conversation || require("../models/Conversation");
const Message = mongoose.models.Message || require("../models/Message");
const User = mongoose.models.User || require("../models/User");

// Import Brand để check cho Seller
let Brand;
try {
    Brand = mongoose.models.Brand || require("../models/Brand");
} catch (e) {
    // Schema dự phòng (chỉ để tìm kiếm, không tạo mới nếu không cần thiết)
    const BrandSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }, { strict: false });
    Brand = mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
}

/* ===========================================
   1. API LẤY TIN NHẮN (Dùng chung cho cả 2)
=========================================== */
router.get("/messages", auth, async (req, res) => {
  try {
    const { userId, brandId } = req.query;
    
    // Validate cơ bản
    if (!userId || !brandId || userId === 'undefined' || brandId === 'undefined') {
        return res.status(200).json([]);
    }

    const conversation = await Conversation.findOne({
      members: { $all: [userId, brandId] },
    });

    if (!conversation) return res.status(200).json([]);

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Lỗi API Messages:", err);
    res.status(500).json([]);
  }
});

/* ===========================================
   2. API LẤY DANH SÁCH CHAT (CHỈ DÀNH CHO SELLER)
=========================================== */
router.get("/conversations", auth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const currentUser = await User.findById(userId);

        if (!currentUser) return res.status(404).json([]);

        // ======================================================
        // 🛡️ GUARD: CHẶN KHÁCH HÀNG THƯỜNG
        // ======================================================
        // Nếu user này không phải là 'seller', trả về rỗng ngay lập tức.
        // (Giả sử trong User Model bạn có trường 'role'. Nếu không có, bỏ qua dòng if này)
        if (currentUser.role && currentUser.role !== 'seller') {
            // console.log(`ℹ️ User [${currentUser.email}] là Khách hàng -> Không có danh sách chat Seller.`);
            return res.status(200).json([]);
        }

        // ======================================================
        // 🛠 AUTO-FIX CHO SELLER: Chỉ Tìm Lại Brand Cũ (Không tạo mới)
        // ======================================================
        if (!currentUser.brandId) {
            console.log(`⚠️ Seller [${currentUser.email}] bị mất liên kết BrandId. Đang tìm lại...`);
            
            // Tìm Brand sở hữu bởi Seller này (Tìm theo userId hoặc sellerId)
            // LƯU Ý: Không dùng .create() ở đây nữa để tránh lỗi Duplicate Key
            const myBrand = await Brand.findOne({ 
                $or: [{ userId: currentUser._id }, { sellerId: currentUser._id }] 
            });

            if (myBrand) {
                console.log(`   -> ✅ Đã tìm thấy Brand: [${myBrand.name || 'Unnamed'}]. Đang liên kết lại...`);
                currentUser.brandId = myBrand._id;
                await currentUser.save();
            } else {
                console.log("   -> ❌ Không tìm thấy Brand nào của Seller này. Vui lòng tạo Shop trước.");
                return res.status(200).json([]);
            }
        }
        // ======================================================

        const brandId = currentUser.brandId.toString();

        // Tìm các cuộc hội thoại của Brand này
        const conversations = await Conversation.find({
            members: { $in: [brandId] },
        }).sort({ updatedAt: -1 });

        // Map dữ liệu hiển thị
        const results = await Promise.all(conversations.map(async (conv) => {
            const customerId = conv.members.find(m => m !== brandId);
            
            let customer = null;
            if (customerId) {
                customer = await User.findById(customerId).select("name avatar email");
            }

            const lastMessage = await Message.findOne({ conversationId: conv._id })
                                             .sort({ createdAt: -1 });

            return {
                conversationId: conv._id,
                user: customer || { 
                    _id: customerId || "unknown", 
                    name: "Khách hàng cũ", 
                    avatar: "", 
                    email: "N/A" 
                },
                lastMessage: lastMessage ? lastMessage.text : "",
                updatedAt: conv.updatedAt
            };
        }));

        res.json(results);

    } catch (err) {
        console.error("❌ Lỗi API Conversations:", err);
        res.status(500).json([]);
    }
});

module.exports = router;