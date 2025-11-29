const express = require("express");
const Variant = require("../../models/Variant");
const Product = require("../../models/Product");
const { auth, sellerAuth } = require("../../middleware/auth");

const router = express.Router();

/* ============================
   GET VARIANTS OF PRODUCT
=============================== */
router.get("/:productId", auth, async (req, res) => {
  try {
    const variants = await Variant.find({ productId: req.params.productId });
    res.json({ success: true, variants });
  } catch (error) {
    console.error("❌ GET VARIANTS ERROR:", error);
    res.status(500).json({ message: "Lỗi lấy variants" });
  }
});

/* ============================
   CREATE VARIANT
=============================== */
router.post("/", auth, sellerAuth, async (req, res) => {
  try {
    const { productId, sku, size, color, price, comparePrice, stock } = req.body;

    const product = await Product.findOne({
      _id: productId,
      seller: req.userId
    });

    if (!product)
      return res.status(404).json({ message: "Không tìm thấy product" });

    const variant = await Variant.create({
      productId,
      sku,
      size,
      color,
      price,
      comparePrice,
      stock
    });

    res.json({ success: true, variant });
  } catch (error) {
    console.error("❌ CREATE VARIANT ERROR:", error);
    res.status(500).json({ message: "Lỗi tạo variant" });
  }
});

/* ============================
   UPDATE VARIANT
=============================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const variant = await Variant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!variant)
      return res.status(404).json({ message: "Variant không tồn tại" });

    res.json({ success: true, variant });
  } catch (error) {
    console.error("❌ UPDATE VARIANT ERROR:", error);
    res.status(500).json({ message: "Lỗi sửa variant" });
  }
});

/* ============================
   DELETE VARIANT
=============================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const variant = await Variant.findByIdAndDelete(req.params.id);

    if (!variant)
      return res.status(404).json({ message: "Không tìm thấy variant" });

    res.json({ success: true, message: "Xóa variant thành công" });
  } catch (error) {
    console.error("❌ DELETE VARIANT ERROR:", error);
    res.status(500).json({ message: "Lỗi xóa variant" });
  }
});

module.exports = router;
