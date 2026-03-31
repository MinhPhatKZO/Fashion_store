const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');

// API GỘP: SMART HYBRID RECOMMENDATION
// Gom chung Cookie và User vào 1 luồng xử lý duy nhất
router.post('/smart', async (req, res) => {
    const limitCount = req.body.limit || 10;
    const recent_item_ids = req.body.recent_item_ids || [];
    const userId = req.body.userId; // Frontend gui len neu khach da dang nhap

    try {
        let finalProducts = [];
        let recommendType = "";

        // ==========================================
        // TANG 1: UU TIEN SO 1 - GOI Y THEO COOKIE (SESSION)
        // Bat mach so thich tuc thoi cua khach hang
        // ==========================================
        if (recent_item_ids.length > 0) {
            try {
                const aiResponse = await axios.post("http://127.0.0.1:8000/recommend/session", {
                    recent_ids: recent_item_ids,
                    recent_item_ids: recent_item_ids,
                    limit: limitCount
                });

                if (aiResponse.data.success && aiResponse.data.recommendations.length > 0) {
                    finalProducts = aiResponse.data.recommendations;
                    recommendType = "AI_SESSION";
                }
            } catch (error) {
                console.log("[AI Hybrid] Tang 1 (Cookie) that bai hoac trong, chuyen xuong Tang 2.");
            }
        }

        // ==========================================
        // TANG 2: NEU TANG 1 TRONG -> DUNG LICH SU USER
        // Dung cho khach moi vao web chua click gi nhung da tung mua hang
        // ==========================================
        if (finalProducts.length === 0 && userId) {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/recommend/${userId}`);
                const recommendedIds = response.data.recommendations;

                if (recommendedIds && recommendedIds.length > 0) {
                    const products = await Product.find({ _id: { $in: recommendedIds } });
                    
                    // Sap xep lai san pham dung theo thu tu AI Python tra ve
                    finalProducts = recommendedIds.map(id => 
                        products.find(p => p._id.toString() === id)
                    ).filter(p => p !== undefined);
                    
                    if(finalProducts.length > 0) {
                        recommendType = "AI_RECOMMEND";
                    }
                }
            } catch (error) {
                // Xu ly gon gang loi 400 de Terminal khong bi do loi
                if (error.response && error.response.status === 400) {
                    console.log(`[AI Hybrid] Tang 2: User ${userId} chua co du lieu hoc, chuyen xuong Tang 3.`);
                } else {
                    console.log("[AI Hybrid] Loi ket noi he thong AI User.");
                }
            }
        }

        // ==========================================
        // TANG 3: NEU CA 2 TANG AI DEU TRONG -> DUNG HANG MAC DINH
        // Dung cho khach la hoac web chua co du lieu
        // ==========================================
        if (finalProducts.length === 0) {
            finalProducts = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(limitCount);
            recommendType = "FALLBACK";
            console.log("[AI Hybrid] Da dung Tang 3: San pham mac dinh.");
        }

        // TRA VE KET QUA CHO FRONTEND
        return res.json({ 
            success: true, 
            products: finalProducts, 
            type: recommendType 
        });

    } catch (error) {
        console.log("[AI Hybrid] Loi Server Node.js:", error.message);
        const fallbackProducts = await Product.find({ isActive: true }).limit(limitCount);
        return res.json({ success: true, products: fallbackProducts, type: "ERROR_FALLBACK" });
    }
});

module.exports = router;