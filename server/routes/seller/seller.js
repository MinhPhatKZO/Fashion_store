const express = require("express");
const router = express.Router();
const { auth, sellerBrandAuth } = require("../../middleware/auth");

const Order = require("../../models/Order");
const Product = require("../../models/Product");

// ===============================
//      API SELLER DASHBOARD
// ===============================
router.get("/dashboard", auth, sellerBrandAuth, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const brandId = req.sellerBrandId;

    // ===============================
    // 1. SẢN PHẨM THEO BRAND
    // ===============================
    const products = await Product.find({ brandId })
      .select("name price stock sold views image")
      .sort({ createdAt: -1 });

    // ===============================
    // 2. ĐƠN HÀNG CỦA SELLER
    // ===============================
    const orders = await Order.find({ seller: sellerId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // ===============================
    // 3. THỐNG KÊ DOANH THU
    // ===============================
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // CN

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;
    let totalRevenue = 0;

    const weekRevenue = Array(7).fill(0);   // CN -> T7
    const monthRevenue = Array(12).fill(0); // T1 -> T12

    orders.forEach((order) => {
      /**
       * ✅ LOGIC ĐÚNG NGHIỆP VỤ
       * - Tính tất cả đơn KHÔNG bị huỷ
       * - KHỚP UI: completed / shipped / processing
       */
      if (order.status === "cancelled") return;

      const created = new Date(order.createdAt);
      const price = Number(order.totalPrice) || 0;

      totalRevenue += price;

      // Hôm nay
      if (created >= startOfDay) {
        revenueToday += price;
      }

      // Tuần này
      if (created >= startOfWeek) {
        revenueWeek += price;
        weekRevenue[created.getDay()] += price;
      }

      // Tháng này
      if (created >= startOfMonth) {
        revenueMonth += price;
      }

      // Năm nay (biểu đồ)
      if (created.getFullYear() === now.getFullYear()) {
        monthRevenue[created.getMonth()] += price;
      }
    });

    // ===============================
    // 4. RESPONSE
    // ===============================
    return res.status(200).json({
      brandInfo: {
        id: req.sellerBrand._id,
        name: req.sellerBrand.name,
        logo: req.sellerBrand.logoUrl,
      },
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
      },
      products,
      orders,
      revenue: {
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth,
        chartWeek: weekRevenue,
        chartMonth: monthRevenue,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({
      message: "Lỗi Server khi tải Dashboard",
      error: error.message,
    });
  }
});

module.exports = router;
