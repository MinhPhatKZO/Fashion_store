const express = require("express");
const Variant = require("../../models/Variant"); // Đảm bảo tên file model đúng (Variant.js hoặc Variants.js)
const Product = require("../../models/Product");
// 1. Import sellerBrandAuth
const { auth, sellerBrandAuth } = require("../../middleware/auth");

const router = express.Router();

/* ============================
   GET VARIANTS OF PRODUCT (Cho Seller Dashboard)
=============================== */
router.get("/:productId", auth, sellerBrandAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Kiểm tra xem Product này có thuộc về Brand của Seller không
    const product = await Product.findOne({ 
      _id: productId, 
      brandId: req.sellerBrandId 
    });

    if (!product) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập sản phẩm này" });
    }

    // 2. Lấy danh sách variant
    const variants = await Variant.find({ productId: productId });
    res.json({ success: true, variants });
  } catch (error) {
    console.error("❌ GET VARIANTS ERROR:", error);
    res.status(500).json({ message: "Lỗi lấy variants" });
  }
});

/* ============================
   CREATE VARIANT
=============================== */
router.post("/", auth, sellerBrandAuth, async (req, res) => {
  try {
    const { productId, sku, size, color, price, comparePrice, stock } = req.body;

    // 1. Validate quyền sở hữu Product
    // Chỉ cho phép tạo variant nếu product thuộc Brand của Seller
    const product = await Product.findOne({
      _id: productId,
      brandId: req.sellerBrandId // Lấy từ middleware
    });

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm hoặc bạn không có quyền" });
    }

    // 2. Tạo Variant
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
    res.status(500).json({ message: "Lỗi tạo variant", error: error.message });
  }
});

/* ============================
   UPDATE VARIANT
=============================== */
router.put("/:id", auth, sellerBrandAuth, async (req, res) => {
  try {
    // 1. Tìm Variant cần sửa
    const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: "Variant không tồn tại" });
    }

    // 2. CHECK BẢO MẬT: Kiểm tra Product cha của variant này có thuộc Brand của Seller không
    const product = await Product.findOne({
      _id: variant.productId,
      brandId: req.sellerBrandId
    });

    if (!product) {
      return res.status(403).json({ message: "Bạn không có quyền sửa biến thể này" });
    }

    // 3. Cập nhật (Sử dụng findByIdAndUpdate sau khi đã check quyền)
    const updatedVariant = await Variant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, variant: updatedVariant });
  } catch (error) {
    console.error("❌ UPDATE VARIANT ERROR:", error);
    res.status(500).json({ message: "Lỗi sửa variant" });
  }
});

/* ============================
   DELETE VARIANT
=============================== */
router.delete("/:id", auth, sellerBrandAuth, async (req, res) => {
  try {
    // 1. Tìm Variant cần xóa
    const variant = await Variant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({ message: "Không tìm thấy variant" });
    }

    // 2. CHECK BẢO MẬT: Kiểm tra quyền sở hữu Product cha
    const product = await Product.findOne({
      _id: variant.productId,
      brandId: req.sellerBrandId
    });

    if (!product) {
      return res.status(403).json({ message: "Bạn không có quyền xóa biến thể này" });
    }

    // 3. Xóa
    await Variant.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Xóa variant thành công" });
  } catch (error) {
    console.error("❌ DELETE VARIANT ERROR:", error);
    res.status(500).json({ message: "Lỗi xóa variant" });
  }
});

module.exports = router;