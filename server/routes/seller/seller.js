const express = require("express");
const router = express.Router();
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const mongoose = require("mongoose");

// Middleware: xác định seller
const sellerAuth = (req, res, next) => {
  // Ví dụ: userId lưu trong token hoặc header
  req.userId = req.headers["x-user-id"];
  next();
};

router.use(sellerAuth);

// GET /api/seller/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const sellerId = req.userId;

    // Lấy tất cả đơn hàng của seller
    const products = await Product.find({ seller_id: sellerId }).select("_id");
    const productIds = products.map((p) => p._id);

    const orders = await Order.find({ "items.product": { $in: productIds } }).sort({ createdAt: -1 });

    const today = new Date();

    // Tính doanh thu
    const isSameDay = (dateStr) => new Date(dateStr).toDateString() === today.toDateString();
    const isSameWeek = (dateStr) => {
      const date = new Date(dateStr);
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      return date >= firstDayOfWeek && date <= lastDayOfWeek;
    };
    const isSameMonth = (dateStr) => {
      const date = new Date(dateStr);
      return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    };

    const revenueToday = orders.filter((o) => isSameDay(o.createdAt)).reduce((sum, o) => sum + o.totalPrice, 0);
    const revenueWeek = orders.filter((o) => isSameWeek(o.createdAt)).reduce((sum, o) => sum + o.totalPrice, 0);
    const revenueMonth = orders.filter((o) => isSameMonth(o.createdAt)).reduce((sum, o) => sum + o.totalPrice, 0);

    // Thống kê trạng thái đơn hàng
    const statusStats = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      revenueToday,
      revenueWeek,
      revenueMonth,
      totalOrders: orders.length,
      recentOrders: orders.slice(0, 10),
      statusStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
