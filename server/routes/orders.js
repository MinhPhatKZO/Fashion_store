const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Variant = require("../models/Variants");

const { auth } = require("../middleware/auth");

const router = express.Router();

/* ============================================
   GET: Lấy danh sách đơn hàng của user
   ============================================ */
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.userId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================
   GET: Lấy chi tiết đơn hàng theo ID
   ============================================ */
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId,
    })
      .populate("items.product", "name images price")
      .populate("user", "name email phone");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ order });
  } catch (error) {
    console.error("❌ Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================
   POST: Tạo đơn COD (dùng Variant collection)
   ============================================ */
router.post("/cod", auth, async (req, res) => {
  try {
    const { items, shippingAddress: shippingInfoObject, orderNumber } = req.body;

    if (!items?.length)
      return res.status(400).json({ message: "Giỏ hàng rỗng." });

    if (!shippingInfoObject)
      return res.status(400).json({ message: "Thiếu thông tin giao hàng." });

    const shippingAddressString = `
      Người nhận: ${shippingInfoObject.fullName},
      ĐT: ${shippingInfoObject.phone},
      Địa chỉ: ${shippingInfoObject.address}
    `;

    let calculatedTotalPrice = 0;
    const shippingFee = 30000;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      let finalPrice = product.price;
      let variant = null;

      if (item.variantId) {
        variant = await Variant.findById(item.variantId);
        if (!variant)
          return res.status(404).json({ message: "Variant not found" });

        finalPrice = variant.price;
      }

      const itemTotal = finalPrice * item.quantity;
      calculatedTotalPrice += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: finalPrice,
        variantId: variant?._id,
        productName: product.name,
      });
    }

    const finalTotal = calculatedTotalPrice + shippingFee;

    const order = new Order({
      user: req.userId,
      orderNumber: orderNumber || `ORD-${Date.now()}`,
      items: orderItems,
      shippingAddress: shippingAddressString,
      totalPrice: finalTotal,
      paymentMethod: "COD",
      status: "unconfirmed",
    });

    await order.save();

    res.status(201).json({ message: "Order created successfully (COD)", order });

  } catch (error) {
    console.error("❌ Create COD error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================
   POST: Tạo đơn thường (có MoMo)
   ============================================ */
router.post(
  "/",
  auth,
  [
    body("items").isArray({ min: 1 }),
    body("shippingAddress").isObject(),
    body("paymentMethod").isIn([
      "cod",
      "credit_card",
      "bank_transfer",
      "wallet",
      "momo",
    ]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { items, shippingAddress, paymentMethod, notes } = req.body;

      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product);

        if (!product)
          return res
            .status(400)
            .json({ message: `Product ${item.product} not found` });

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal,
        });
      }

      const shippingCost = subtotal > 500000 ? 0 : 30000;
      const tax = Math.round(subtotal * 0.1);
      const total = subtotal + shippingCost + tax;

      const order = new Order({
        user: req.userId,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        shippingCost,
        tax,
        total,
        notes,
      });

      await order.save();

      if (paymentMethod === "momo") {
        /// Momo logic...
      }

      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error("❌ Create order error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/* ============================================
   PUT: Cancel order
   ============================================ */
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["pending", "confirmed", "unconfirmed"].includes(order.status)) {
      return res
        .status(400)
        .json({ message: "Order cannot be cancelled at this stage" });
    }

    order.status = "cancelled";
    order.cancelReason = reason || "Cancelled by user";
    order.cancelledAt = new Date();

    await order.save();

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("❌ Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
