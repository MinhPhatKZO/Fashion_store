const express = require("express");
const router = express.Router();
const { auth, sellerAuth } = require("../../middleware/auth");

const Order = require("../../models/Order");
const Product = require("../../models/Product");

// ===============================
//      API SELLER DASHBOARD
// ===============================
router.get("/dashboard", auth, sellerAuth, async (req, res) => {
  try {
    const sellerId = req.userId; // sellerId từ middleware auth

    // ===============================
    // 1. Lấy danh sách sản phẩm theo seller
    // ===============================
    const products = await Product.find({ userId: sellerId }).select(
      "name price stock"
    );

    // ===============================
    // 2. Lấy đơn hàng của seller
    // ===============================
    const orders = await Order.find({ seller: sellerId }).sort({
      createdAt: -1,
    });

    // ===============================
    // 3. Tính doanh thu theo ngày – tuần – tháng
    // ===============================
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // CN = 0

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;

    let weekRevenue = Array(7).fill(0); // CN->T7
    let monthRevenue = Array(12).fill(0); // Tháng 1->12

    orders.forEach((order) => {
      const created = new Date(order.createdAt);
      const price = order.totalPrice;

      if (created >= startOfDay) revenueToday += price;
      if (created >= startOfWeek) {
        revenueWeek += price;
        weekRevenue[created.getDay()] += price;
      }
      if (created >= startOfMonth) revenueMonth += price;

      monthRevenue[created.getMonth()] += price;
    });

    return res.status(200).json({
      products,
      orders,
      revenueToday,
      revenueWeek,
      revenueMonth,
      weekRevenue,
      monthRevenue,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
