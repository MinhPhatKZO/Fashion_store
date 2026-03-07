// server/routes/recommendations.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Cố gắng gọi sang AI Python
        const response = await axios.get(`http://localhost:8000/recommend/${userId}`);
        const recommendedIds = response.data.recommendations;

        // 2. Nếu AI có gợi ý (User cũ đã có hành vi)
        if (recommendedIds && recommendedIds.length > 0) {
            // Lấy sản phẩm từ DB (Lúc này thứ tự đang bị lộn xộn theo DB)
            const products = await Product.find({ _id: { $in: recommendedIds } });

            // 👇 BƯỚC QUAN TRỌNG: Ép xếp hạng lại đúng theo thứ tự AI trả về 👇
            const sortedProducts = recommendedIds.map(id => 
                products.find(p => p._id.toString() === id)
            ).filter(p => p !== undefined); // Lọc bỏ nếu lỡ có sản phẩm bị xóa khỏi DB

            return res.json({ success: true, products: sortedProducts, type: "AI_RECOMMEND" });
        }

        // 3. PHƯƠNG ÁN DỰ PHÒNG: Nếu AI trả về rỗng (User mới chưa có dữ liệu)
        // Lấy đại 10 sản phẩm mới nhất bù vào để giao diện lưới không bị trống
        const fallbackProducts = await Product.find().sort({ createdAt: -1 }).limit(10);
        return res.json({ success: true, products: fallbackProducts, type: "FALLBACK" });

    } catch (error) {
        console.error("Lỗi AI (Có thể chưa bật Python):", error.message);
        
        // 4. Nếu Python sập/chưa bật, vẫn ráng trả về sản phẩm để UI không bị trống
        const fallbackProducts = await Product.find().limit(10);
        return res.json({ success: true, products: fallbackProducts, type: "ERROR_FALLBACK" });
    }
});

module.exports = router;