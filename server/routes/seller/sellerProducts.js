const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../../models/Product");
const { auth, sellerAuth } = require("../../middleware/auth");

const router = express.Router();

/* ============================
   MULTER CONFIG
=============================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../web/public/assets/products"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/* ============================
   GET ALL PRODUCTS OF SELLER
=============================== */
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("❌ GET PRODUCTS ERROR:", error);
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách sản phẩm" });
  }
});

/* ============================
   CREATE PRODUCT
=============================== */
router.post("/", auth, sellerAuth, async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      originalPrice,
      categoryId,
      subcategoryId,
      brandId,
      sku,
      stock,
      tags,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      originalPrice,
      categoryId,
      subcategoryId,
      brandId,
      sku,
      stock,
      tags,
      seller: req.userId,
    });

    res.json({ success: true, product });
  } catch (error) {
    console.error("❌ CREATE PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Lỗi tạo sản phẩm" });
  }
});

// ===============================
// GET PRODUCT (seller only)
// ===============================
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id,
    });

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json({ product });
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ===============================
// UPDATE PRODUCT
// ===============================
router.put("/:id", auth, async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      price: req.body.price,
      stock: req.body.stock,
      brandId: req.body.brandId || null,
      categoryId: req.body.categoryId || null,
      images: req.body.images ?? [],
    };

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json({ message: "Cập nhật thành công", product });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ===============================
// UPLOAD IMAGES
// ===============================
router.post("/:id/images", auth, upload.array("images", 10), async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id,
    });

    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const uploadedPaths = req.files.map((f) => `/assets/products/${f.filename}`);

    product.images = [...product.images, ...uploadedPaths];

    await product.save();

    res.json({
      message: "Upload ảnh thành công",
      product,
    });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;

/* ============================
   DELETE PRODUCT
=============================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.userId,
    });

    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json({ success: true, message: "Xoá sản phẩm thành công" });
  } catch (error) {
    console.error("❌ DELETE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Lỗi xoá sản phẩm" });
  }
});

module.exports = router;
