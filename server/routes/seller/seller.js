const express = require("express");
const router = express.Router();
const { auth, sellerAuth } = require("../../middleware/auth");

const Order = require("../../models/Order");
const Product = require("../../models/Product");

router.get("/dashboard", auth, sellerAuth, async (req, res) => {
  try {
    const sellerId = req.userId;

    const products = await Product.find({ userId: sellerId }).select(
      "name price stock"
    );

    const orders = await Order.find({ seller: sellerId }).sort({ createdAt: -1 });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;

    let weekRevenue = Array(7).fill(0);
    let monthRevenue = Array(12).fill(0);

    orders.forEach((order) => {
      const created = new Date(order.createdAt);

      // ⭐ FIX QUAN TRỌNG: Convert totalPrice về số
      const price = Number(order.totalPrice) || 0;

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
