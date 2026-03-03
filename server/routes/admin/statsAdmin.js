const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const { auth, adminAuth } = require("../../middleware/auth");

router.get("/seller-revenue", auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Chỉnh lại Match: Lấy các trạng thái có doanh thu thực tế
    let match = { 
      status: { $in: ["completed", "delivered", "shipped", "pending", "processing"] } 
    };

    // 2. Xử lý thời gian chính xác
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await Order.aggregate([
      { $match: match },

      // Nhóm theo ID Seller
      {
        $group: {
          _id: "$seller",
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
        },
      },

      // Kết nối với bảng users để lấy thông tin Seller
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sellerInfo",
        },
      },

      // Giải nén mảng sellerInfo (Dùng preserveNullAndEmptyArrays để tránh mất dữ liệu)
      { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: true } },

      // Định dạng lại đầu ra
      {
        $project: {
          _id: 0,
          sellerId: "$_id",
          sellerName: { $ifNull: ["$sellerInfo.name", "N/A (Sellers đã xóa)"] },
          sellerEmail: { $ifNull: ["$sellerInfo.email", "Không có email"] },
          totalRevenue: 1,
          totalOrders: 1,
        },
      },

      { $sort: { totalRevenue: -1 } },
    ]);

    // Tính tổng quan hệ thống
    const summary = data.reduce(
      (acc, cur) => {
        acc.totalRevenue += cur.totalRevenue;
        acc.totalOrders += cur.totalOrders;
        return acc;
      },
      { totalRevenue: 0, totalOrders: 0 }
    );

    res.json({
      success: true,
      data,
      summary,
    });
  } catch (err) {
    console.error("Lỗi thống kê Admin:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Lấy chi tiết đơn hàng của 1 Seller cụ thể để xem chi tiết
router.get("/seller-details/:sellerId", auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { 
      seller: sellerId,
      status: { $in: ["completed", "delivered", "shipped", "pending", "processing"] }
    };

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Lấy đơn hàng và lấy thêm thông tin khách hàng (user)
    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;