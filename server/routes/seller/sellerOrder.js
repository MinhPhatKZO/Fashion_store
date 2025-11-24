// server/routes/orders.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");
const { auth } = require("../../middleware/auth");

/* =======================================================
   Tạo mã đơn hàng: ORD00001
======================================================= */
async function generateOrderNumber() {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });

  if (!lastOrder) return "ORD00001";

  const number = parseInt(lastOrder.orderNumber.replace("ORD", "")) + 1;
  return "ORD" + number.toString().padStart(5, "0");
}

/* =======================================================
   CREATE ORDER
======================================================= */
router.post("/", auth, async (req, res) => {
  try {
    const { items, paymentMethod, shippingAddress, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const newOrder = await Order.create({
      orderNumber: await generateOrderNumber(),
      user: req.userId,
      items,
      totalPrice,
      paymentMethod,
      shippingAddress,
      notes,
    });

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      order: newOrder,
    });
  } catch (err) {
    console.error("CreateOrder Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   GET ALL ORDERS (Seller/Admin)
======================================================= */
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price images");

    res.json(orders);
  } catch (err) {
    console.error("GetAllOrders Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   GET ORDER BY ID
======================================================= */
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name images price");

    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   UPDATE ORDER STATUS
======================================================= */
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    res.json({ message: "Cập nhật trạng thái thành công", order });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   DELETE ORDER
======================================================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    res.json({ message: "Xóa đơn hàng thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   DASHBOARD STATISTICS: Today / Week / Month Revenue
======================================================= */
router.get("/stats/today", auth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const revenue = await Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({ todayRevenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/stats/week", auth, async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const revenue = await Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({ weekRevenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/stats/month", auth, async (req, res) => {
  try {
    const start = new Date();
    start.setDate(1);

    const revenue = await Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({ monthRevenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
