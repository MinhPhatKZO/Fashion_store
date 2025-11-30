const express = require('express');
const Promotion = require('../models/Promotion');

const router = express.Router();

/**
 * 📌 Lấy tất cả khuyến mãi theo 3 nhóm:
 * - active: đang diễn ra
 * - upcoming: sắp diễn ra
 * - expired: vừa kết thúc (2 tháng gần đây)
 * Mỗi promotion kèm thời gian còn lại tính theo giây.
 */
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // 1️⃣ Đang diễn ra
    const activePromotionsRaw = await Promotion.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ startDate: 1 });

    const activePromotions = activePromotionsRaw.map((promo) => ({
      ...promo.toObject(),
      status: 'active',
      // Thời gian còn lại tính bằng giây
      timeRemaining: Math.floor((new Date(promo.endDate).getTime() - now.getTime()) / 1000)
    }));

    // 2️⃣ Sắp diễn ra
    const upcomingPromotionsRaw = await Promotion.find({
      startDate: { $gt: now }
    }).sort({ startDate: 1 });

    const upcomingPromotions = upcomingPromotionsRaw.map((promo) => ({
      ...promo.toObject(),
      status: 'upcoming',
      // Thời gian tới bắt đầu tính bằng giây
      timeRemaining: Math.floor((new Date(promo.startDate).getTime() - now.getTime()) / 1000)
    }));

    // 3️⃣ Vừa kết thúc (2 tháng gần đây)
    const expiredPromotionsRaw = await Promotion.find({
      endDate: { $lt: now, $gte: twoMonthsAgo }
    }).sort({ endDate: -1 });

    const expiredPromotions = expiredPromotionsRaw.map((promo) => ({
      ...promo.toObject(),
      status: 'expired',
      timeRemaining: 0
    }));

    return res.json({
      active: activePromotions,
      upcoming: upcomingPromotions,
      expired: expiredPromotions
    });
  } catch (error) {
    console.error("❌ Promotion API error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
