const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');

// API GỘP: SMART HYBRID RECOMMENDATION
router.post('/smart', async (req, res) => {
    const limitCount = req.body.limit || 10;
    const recent_item_ids = req.body.recent_item_ids || [];
    const userId = req.body.userId || ""; 

    try {
        let finalProducts = [];
        let recommendType = "FALLBACK";

        // ==========================================
        // TẦNG 1: GỌI DEEP HYBRID AI (PYTHON)
        // Giao toàn quyền quyết định (Session + DNA) cho Python
        // ==========================================
        if (userId || recent_item_ids.length > 0) {
            try {
                // Gọi vào API duy nhất mà chúng ta vừa tạo bên FastAPI
                const aiResponse = await axios.post("http://127.0.0.1:8000/api/ai/recommend", {
                    user_id: userId,
                    recent_item_ids: recent_item_ids
                });

                if (aiResponse.data.success && aiResponse.data.recommended_products.length > 0) {
                    const recommendedIds = aiResponse.data.recommended_products;

                    // Query DB Node.js để lấy data thật (tên, giá, hình ảnh) dựa trên ID
                    const products = await Product.find({ _id: { $in: recommendedIds } });
                    
                    // QUAN TRỌNG: Sắp xếp lại sản phẩm đúng theo thứ tự điểm số AI trả về
                    finalProducts = recommendedIds.map(id => 
                        products.find(p => p._id.toString() === id)
                    ).filter(p => p !== undefined).slice(0, limitCount);
                    
                    if(finalProducts.length > 0) {
                        recommendType = "DEEP_HYBRID_AI";
                    }
                }
            } catch (error) {
                console.log("[NodeJS] Lỗi kết nối hoặc Python AI xử lý thất bại:", error.message);
            }
        }

        // ==========================================
        // TẦNG 2: KẾ HOẠCH B (FALLBACK)
        // Chỉ chạy khi Python AI chết, hoặc web trống trơn không có thông tin gì
        // ==========================================
        if (finalProducts.length === 0) {
            finalProducts = await Product.find({ isActive: true })
                .sort({ createdAt: -1 }) // Ưu tiên hàng mới nhất
                .limit(limitCount);
            recommendType = "NEWEST_FALLBACK";
            console.log("[NodeJS] Đã dùng Tầng 2: Sản phẩm mặc định (Mới nhất).");
        }

        // TRẢ VỀ KẾT QUẢ CHO FRONTEND REACT
        return res.json({ 
            success: true, 
            products: finalProducts, 
            type: recommendType 
        });

    } catch (error) {
        console.log("[NodeJS] Lỗi Server Node.js:", error.message);
        const fallbackProducts = await Product.find({ isActive: true }).limit(limitCount);
        return res.json({ success: true, products: fallbackProducts, type: "ERROR_FALLBACK" });
    }
});

module.exports = router;