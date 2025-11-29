const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");

const moment = require("moment");
const qs = require("qs");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Variant = require("../models/Variants");
const { auth } = require("../middleware/auth");

const router = express.Router();


// Helper to get user id from auth
const getUserId = (req) => req.user?._id || req.user?.id || req.userId;

/* =======================================================
POST: Tạo đơn thanh toán Online (không tạo URL VNPay ở đây)
======================================================= */
router.post("/vnpay-order", auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Danh sách sản phẩm không hợp lệ" });
    }

    let totalPrice = 0;
    const orderItems = [];
    let seller = null;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ message: "Product not found" });

      if (!seller) seller = product.seller;
      else if (seller.toString() !== product.seller.toString())
        return res.status(400).json({
          message: "Tất cả sản phẩm phải thuộc cùng 1 người bán",
        });

      totalPrice += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const order = new Order({
      user: getUserId(req),
      seller,
      items: orderItems,
      shippingAddress:
        typeof shippingAddress === "object"
          ? JSON.stringify(shippingAddress)
          : shippingAddress,
      paymentMethod,
      totalPrice,
      notes,
      orderNumber: `ORD-${Date.now()}`,
      status: "pending",
    });

    await order.save();

    // Nếu là VNPay thì frontend sẽ gọi API tách riêng /vnpay
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({ message: error.message });
  }
});

/* =======================================================
POST: Tạo đơn thanh toán MoMo (không tạo URL MoMo ở đây)
======================================================= */
router.post("/momo-order", auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Danh sách sản phẩm không hợp lệ" });
    }

    let totalPrice = 0;
    const orderItems = [];
    let seller = null;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ message: "Product not found" });

      if (!seller) seller = product.seller;
      else if (seller.toString() !== product.seller.toString())
        return res.status(400).json({
          message: "Tất cả sản phẩm phải thuộc cùng 1 người bán",
        });

      totalPrice += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // ======= Tạo đơn hàng MOMO =======
    const order = new Order({
      user: getUserId(req),
      seller,
      items: orderItems,
      shippingAddress:
        typeof shippingAddress === "object"
          ? JSON.stringify(shippingAddress)
          : shippingAddress,
      paymentMethod: "momo",  // ✔ Bắt buộc là momo
      totalPrice,
      notes,
      orderNumber: `MOMO-${Date.now()}`,
      status: "pending",
    });

    await order.save();

    // Frontend sẽ gọi API /momo-payment sau khi tạo order
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error("❌ MoMo Create order error:", error);
    res.status(500).json({ message: error.message });
  }
});

/* =======================================================
PATCH: Cập nhật địa chỉ giao hàng
======================================================= */
router.patch("/update-shipping/:id", auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "shippingAddress không được để trống" });
    }

    // Tìm order của user hiện tại
    const order = await Order.findOne({ _id: orderId, user: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    order.shippingAddress = shippingAddress;
    await order.save();

    res.json({ success: true, message: "Cập nhật địa chỉ giao hàng thành công", order });
  } catch (err) {
    console.error("UPDATE SHIPPING ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =======================================================
GET: Lấy danh sách đơn hàng của user
======================================================= */
router.get("/", auth, async (req, res) => {
try {
const { page = 1, limit = 10, status } = req.query;


const filter = { user: getUserId(req) };


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
user: getUserId(req),
})
.populate("items.product", "name images price")
.populate("seller", "name email")
.populate("user", "name email");


if (!order)
return res.status(404).json({ message: "Không tìm thấy đơn hàng" });


res.json({ success: true, order });
} catch (err) {
console.error(err);
res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng" });
}
});
/* =======================================================
POST: Tạo đơn COD (có Variant)
======================================================= */
router.post("/cod", auth, async (req, res) => {
try {
const { items, shippingAddress } = req.body;


if (!items?.length)
return res.status(400).json({ message: "Giỏ hàng trống" });


let totalPrice = 0;
let seller = null;
const orderItems = [];


for (const item of items) {
const product = await Product.findById(item.productId || item.product);
if (!product) return res.status(404).json({ message: "Product not found" });


if (!seller) seller = product.seller;
else if (seller.toString() !== product.seller.toString())
return res.status(400).json({
message: "Tất cả sản phẩm phải thuộc cùng 1 người bán",
});


totalPrice += product.price * item.quantity;


orderItems.push({
product: product._id,
quantity: item.quantity,
price: product.price,
});
}


const finalOrder = await Order.create({
user: getUserId(req),
seller,
items: orderItems,
orderNumber: `ORD-${Date.now()}`,
shippingAddress: typeof shippingAddress === 'object' ? JSON.stringify(shippingAddress) : shippingAddress,
totalPrice,
paymentMethod: "COD",
status: "pending",
});


res.json({ success: true, order: finalOrder });
} catch (err) {
console.error(err);
res.status(500).json({ message: "Tạo đơn COD thất bại" });
}
});


/* =======================================================
POST: Tạo đơn thanh toán (MoMo / Bank / Wallet)
======================================================= */
router.post("/", auth, async (req, res) => {
try {
const { items, shippingAddress, paymentMethod, notes } = req.body;


if (!items || !Array.isArray(items) || items.length === 0) {
return res.status(400).json({ message: "Danh sách sản phẩm không hợp lệ" });
}


let totalPrice = 0;
const orderItems = [];
let seller = null;


for (const item of items) {
const product = await Product.findById(item.product);


if (!product)
return res.status(400).json({ message: "Product not found" });

const itemTotal = product.price * item.quantity;
totalPrice += itemTotal;


orderItems.push({
product: product._id,
quantity: item.quantity,
price: product.price,
});
}


const order = new Order({
user: getUserId(req),
seller,
items: orderItems,
shippingAddress: typeof shippingAddress === 'object' ? JSON.stringify(shippingAddress) : shippingAddress,
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
user: getUserId(req),
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