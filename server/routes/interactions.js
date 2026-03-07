const express = require('express');
const router = express.Router();
const Interaction = require('../models/Interaction');
const { auth } = require('../middleware/auth'); // Middleware kiểm tra đăng nhập của bạn

// API: Lưu lại tương tác của người dùng (Chỉ dành cho user đã đăng nhập)
router.post('/', auth, async (req, res) => {
    try {
        const { productId, action } = req.body;
        const userId = req.user.id; // Lấy từ token qua middleware auth

        // Gán điểm số dựa trên hành động
        let score = 1;
        if (action === 'cart') score = 3;
        if (action === 'buy') score = 5;

        // Tìm xem người dùng này đã có hành động tương tự với sản phẩm này chưa
        let interaction = await Interaction.findOne({ userId, productId, action });

        if (interaction) {
            // Nếu có rồi, cập nhật thời gian mới nhất (không cần tạo mới để tránh rác database)
            interaction.updatedAt = Date.now();
            await interaction.save();
        } else {
            // Nếu chưa, tạo ghi chú mới
            interaction = new Interaction({
                userId,
                productId,
                action,
                score
            });
            await interaction.save();
        }

        res.status(200).json({ success: true, message: "Đã ghi nhận tương tác" });
    } catch (error) {
        console.error("Lỗi lưu interaction:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
});

module.exports = router;