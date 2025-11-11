const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const auth = require("../middleware/auth"); 

const router = express.Router();

/* -----------------------------
   🛒 1. LẤY GIỎ HÀNG CỦA NGƯỜI DÙNG
-------------------------------- */
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });

    if (!cart) return res.json({ items: [], totalPrice: 0 });

    res.json(cart);
  } catch (error) {
    console.error("❌ Get cart error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* -----------------------------
   ➕ 2. THÊM SẢN PHẨM VÀO GIỎ
-------------------------------- */
router.post("/add", async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Tìm xem sản phẩm đã có trong giỏ chưa
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

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
    res.json({ message: "Đã thêm sản phẩm vào giỏ hàng", cart });
  } catch (error) {
    console.error("❌ Add to cart error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* -----------------------------
   ✏️ 3. CẬP NHẬT SỐ LƯỢNG
-------------------------------- */
router.put("/update", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (quantity <= 0) {
      return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ" });

    item.quantity = quantity;
    item.subtotal = item.price * quantity;

    await cart.save();
    res.json({ message: "Đã cập nhật giỏ hàng", cart });
  } catch (error) {
    console.error("❌ Update cart error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* -----------------------------
   ❌ 4. XÓA SẢN PHẨM KHỎI GIỎ
-------------------------------- */
router.delete("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();

    res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng", cart });
  } catch (error) {
    console.error("❌ Remove cart item error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* -----------------------------
   🧹 5. XÓA TOÀN BỘ GIỎ HÀNG
-------------------------------- */
router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: "Đã xóa toàn bộ giỏ hàng" });
  } catch (error) {
    console.error("❌ Clear cart error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
