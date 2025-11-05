const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { auth } = require("../middleware/auth"); // Auth middleware

// Lấy giỏ hàng theo user
router.get("/", auth, async (req, res) => {
  let cart = await Cart.findOne({ user: req.userId }).populate("items.product", "name price images variants");
  if (!cart) cart = await Cart.create({ user: req.userId, items: [], subTotal: 0 });
  res.json(cart);
});

// Thêm sản phẩm vào giỏ
router.post("/add", auth, async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return res.status(404).json({ message: "Product not found" });
  // Kiểm tra tồn kho ở variant nếu có
  if (variant) {
    const matchedVariant = product.variants.find(v => v.size === variant.size && v.color === variant.color);
    if (!matchedVariant || matchedVariant.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock!" });
    }
  }
  let cart = await Cart.findOne({ user: req.userId });
  if (!cart) cart = new Cart({ user: req.userId, items: [] });
  const idx = cart.items.findIndex(item => item.product.equals(productId) && JSON.stringify(item.variant) === JSON.stringify(variant));
  if (idx !== -1) {
    cart.items[idx].quantity += quantity;
    cart.items[idx].total = cart.items[idx].quantity * product.price;
  } else {
    cart.items.push({
      product: product._id,
      variant,
      quantity,
      price: product.price,
      total: product.price * quantity
    });
  }
  cart.subTotal = cart.items.reduce((sum, it) => sum + it.total, 0);
  await cart.save();
  res.json(cart);
});

// Cập nhật số lượng sản phẩm
router.put("/update", auth, async (req, res) => {
  const { productId, quantity, variant } = req.body;
  let cart = await Cart.findOne({ user: req.userId });
  if (!cart) return res.status(404).json({ message: "Cart not found!" });
  const idx = cart.items.findIndex(item => item.product.equals(productId) && JSON.stringify(item.variant) === JSON.stringify(variant));
  if (idx === -1) return res.status(404).json({ message: "Item not found!" });
  cart.items[idx].quantity = quantity;
  cart.items[idx].total = cart.items[idx].price * quantity;
  cart.subTotal = cart.items.reduce((sum, it) => sum + it.total, 0);
  await cart.save();
  res.json(cart);
});

// Xóa sản phẩm khỏi giỏ
router.delete("/remove", auth, async (req, res) => {
  const { productId, variant } = req.body;
  let cart = await Cart.findOne({ user: req.userId });
  if (!cart) return res.status(404).json({ message: "Cart not found!" });
  cart.items = cart.items.filter(item => !(item.product.equals(productId) && JSON.stringify(item.variant) === JSON.stringify(variant)));
  cart.subTotal = cart.items.reduce((sum, it) => sum + it.total, 0);
  await cart.save();
  res.json(cart);
});

module.exports = router;
