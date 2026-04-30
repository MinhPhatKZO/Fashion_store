const express = require('express');
const router = express.Router();
const axios = require('axios');
const Interaction = require('../models/Interaction');
const { auth } = require('../middleware/auth');

// --- CAU HINH TU DONG TRAIN AI ---
let interactionCounter = 0;
// MẸO: Giữ ngưỡng là 5 lúc đi bảo vệ đồ án để dễ demo. 
// Khi chạy thực tế có thể đổi lên 100 hoặc 500.
const TRAIN_THRESHOLD = 5; 
let isTraining = false; 

const triggerAutoTrain = async () => {
    if (isTraining) return; 
    
    try {
        isTraining = true;
        interactionCounter = 0; // Reset biến đếm
        
        console.log(`--- AI SYSTEM: Đã đạt ngưỡng ${TRAIN_THRESHOLD} tương tác. Đang kích hoạt tự động học (Auto-Train) ---`);
        
        // 1. SỬA LẠI ĐÚNG ĐƯỜNG DẪN API CỦA FASTAPI
        const response = await axios.post("http://127.0.0.1:8000/api/ai/train");
        
        if (response.data.success) {
            console.log("--- AI SYSTEM: AI đã học xong trọng số mới! Sẵn sàng phục vụ. ---");
        }
    } catch (error) {
        console.error("--- AI SYSTEM ERROR: Tự động Train thất bại:", error.message);
    } finally {
        isTraining = false;
    }
};

// API: Luu lai tuong tac cua nguoi dung
router.post('/', auth, async (req, res) => {
    try {
        // Đảm bảo action truyền từ Frontend lên là 1 trong 4 chữ: "view", "click", "add_to_cart", "purchase"
        const { productId, action } = req.body;
        const userId = req.user.id;

        // Điểm số này Nodejs lưu cho vui mặt tiền, Python sẽ tự tính lại bằng Dictionary bên đó
        let score = 1;
        if (action === 'add_to_cart') score = 3; // 2. SỬA LẠI TỪ KHÓA CHO KHỚP VỚI PYTHON
        if (action === 'purchase') score = 5;

        let interaction = await Interaction.findOne({ userId, productId, action });

        if (interaction) {
            interaction.updatedAt = Date.now();
            await interaction.save();
        } else {
            // Bên Nodejs lưu action = "add_to_cart" thì bên Python doc.get("type") phải khớp nhé
            // Lưu ý: Cột trong DB của bạn tên là 'action' hay 'type'? 
            // Nếu schema là 'action' thì file python train_engine.py nhớ dùng doc.get("action")
            interaction = new Interaction({ userId, productId, action, score });
            await interaction.save();
        }

        // --- LOGIC ĐẾM VÀ KÍCH HOẠT TRAIN ---
        interactionCounter++;
        console.log(`[AI Counter] Tiến độ thu thập dữ liệu: ${interactionCounter}/${TRAIN_THRESHOLD}`);

        if (interactionCounter >= TRAIN_THRESHOLD && !isTraining) {
            triggerAutoTrain(); // Gọi hàm chạy ngầm, không bắt User chờ
        }

        res.status(200).json({ success: true, message: "Đã ghi nhận tương tác" });
    } catch (error) {
        console.error("Lỗi lưu interaction:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
    }
});

module.exports = router;