const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Variant = require("../models/Variants");

const { auth } = require("../middleware/auth");

const router = express.Router();



// POST create-vnpay-order
router.post("/create-vnpay-order", auth, async (req, res) => {
  try {
    const { items, seller, totalPrice, shippingAddress } = req.body;

    const newOrder = await Order.create({
      user: req.user.id,
      seller,
      items,
      totalPrice,
      shippingAddress,
      paymentMethod: "VNPAY",
      status: "pending",
    });

    res.json({
      success: true,
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Tạo đơn hàng thất bại" });
  }
});

/* =======================================================
   GET: Lấy danh sách đơn hàng của user
   ======================================================= */
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.userId };

    if (status) filter.status = status;

    const skip = (page - 1) * Number(limit);

    const orders = await Order.find(filter)
      .populate("items.product", "name images price")
      .populate("seller", "name email")
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


/* =======================================================
   GET: Lấy chi tiết đơn hàng
   ======================================================= */
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId,
    })
      .populate("items.product", "name images price")
      .populate("seller", "name email")
      .populate("user", "name email phone");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ order });
  } catch (error) {
    console.error("❌ Get order detail error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* =======================================================
   POST: Tạo đơn COD (có Variant)
   ======================================================= */
router.post("/cod", auth, async (req, res) => {
  try {
    const { items, shippingAddress: shippingInfoObject } = req.body;

    if (!items?.length)
      return res.status(400).json({ message: "Giỏ hàng rỗng." });

    if (!shippingInfoObject)
      return res.status(400).json({ message: "Thiếu thông tin giao hàng." });

    let calculatedTotalPrice = 0;
    const shippingFee = 30000;
    const orderItems = [];

    let seller = null;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product)
        return res.status(404).json({ message: "Product not found" });

      // 🔥 Lấy seller từ product
      if (!seller) seller = product.seller;
      else if (seller.toString() !== product.seller.toString()) {
        return res.status(400).json({
          message: "Tất cả sản phẩm phải thuộc cùng một người bán"
        });
      }

      let finalPrice = product.price;
      let variant = null;

      if (item.variantId) {
        variant = await Variant.findById(item.variantId);
        if (!variant)
          return res.status(404).json({ message: "Variant not found" });
        finalPrice = variant.price;
      }

      calculatedTotalPrice += finalPrice * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    const finalTotal = calculatedTotalPrice + shippingFee;

    const shippingAddressString = `
      Người nhận: ${shippingInfoObject.fullName},
      ĐT: ${shippingInfoObject.phone},
      Địa chỉ: ${shippingInfoObject.address}
    `;

    const order = new Order({
      user: req.userId,
      seller,
      orderNumber: `ORD-${Date.now()}`,
      items: orderItems,
      shippingAddress: shippingAddressString,
      totalPrice: finalTotal,
      paymentMethod: "COD",
      status: "pending",
    });

    await order.save();

    res.status(201).json({
      message: "Order created successfully (COD)",
      order,
    });
  } catch (error) {
    console.error("❌ Create COD error:", error);
    res.status(500).json({ message: "Server error" });
  }
});



/* =======================================================
   POST: Tạo đơn thanh toán (MoMo / Bank / Wallet)
   ======================================================= */
router.post("/", auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    let totalPrice = 0;
    const orderItems = [];
    let seller = null;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product)
        return res.status(400).json({
          message: `Product ${item.product} not found`,
        });

      if (!seller) seller = product.seller;
      else if (seller.toString() !== product.seller.toString()) {
        return res.status(400).json({
          message: "Tất cả sản phẩm phải thuộc cùng một người bán"
        });
      }

      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const order = new Order({
      user: req.userId,
      seller,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      notes,
      orderNumber: `ORD-${Date.now()}`,
    });

    await order.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({ message: error.message });
  }
});


/* =======================================================
   PUT: Cancel order
   ======================================================= */
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["pending", "unconfirmed"].includes(order.status)) {
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });
    }

    order.status = "cancelled";
    order.cancelReason = reason || "Cancelled by user";
    order.cancelledAt = new Date();

    await order.save();

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
