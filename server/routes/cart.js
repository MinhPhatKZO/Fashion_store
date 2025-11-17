const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const auth = require("../middleware/auth"); 

const router = express.Router();

// 1️⃣ Lấy giỏ hàng của người dùng
router.get("/:userId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.json({ success: true, data: { items: [], totalPrice: 0 } });
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error("Get cart error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2️⃣ Thêm sản phẩm vào giỏ
router.post("/add", auth, async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const existingItem = cart.items.find(i => i.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
      cart.items.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
      });
    }

    await cart.save();
    res.json({ success: true, message: "Product added to cart", data: cart });
  } catch (error) {
    console.error("Add to cart error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3️⃣ Cập nhật số lượng
router.put("/update", auth, async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (quantity <= 0) return res.status(400).json({ success: false, message: "Quantity must be > 0" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(i => i.productId.toString() === productId);
    if (!item) return res.status(404).json({ success: false, message: "Product not in cart" });

    item.quantity = quantity;
    item.subtotal = item.price * quantity;

    await cart.save();
    res.json({ success: true, message: "Cart updated", data: cart });
  } catch (error) {
    console.error("Update cart error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4️⃣ Xóa sản phẩm khỏi giỏ
router.delete("/remove", auth, async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    await cart.save();

    res.json({ success: true, message: "Product removed", data: cart });
  } catch (error) {
    console.error("Remove cart item error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5️⃣ Xóa toàn bộ giỏ hàng
router.delete("/clear/:userId", auth, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
