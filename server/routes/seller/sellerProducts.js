const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const Brand = require("../../models/Brands");
const { auth } = require("../../middleware/auth");
const Variant = require("../../models/Variants");
const fs = require("fs");
const router = express.Router();
const productImagesPath = path.join("D:/fashion/Fashion_store/web/public/assets/products");

// Nếu folder chưa tồn tại thì tạo
if (!fs.existsSync(productImagesPath)) {
  fs.mkdirSync(productImagesPath, { recursive: true });
  console.log("✅ Folder products đã được tạo:", productImagesPath);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });


/* ======================================
   GET ALL PRODUCTS
====================================== */
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.userId })
      .populate("categoryId", "name")
      .populate("brandId", "name")
      .sort({ createdAt: -1 })
      .lean();

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

/* ======================================
   CREATE PRODUCT
====================================== */
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      originalPrice,
      categoryId,
      brandId,
      sku,
      stock,
      tags,
    } = req.body;

    // kiểm tra brand/category có tồn tại
    if (categoryId && !(await Category.exists({ _id: categoryId }))) {
      return res.status(400).json({ message: "Category không tồn tại" });
    }
    if (brandId && !(await Brand.exists({ _id: brandId }))) {
      return res.status(400).json({ message: "Brand không tồn tại" });
    }

    const product = await Product.create({
      name,
      description,
      price,
      originalPrice,
      categoryId,
      brandId,
      sku,
      stock,
      tags,
      seller: req.userId,
      images: [],
      variants: [],
    });

    res.json({ success: true, product });
  } catch (error) {
    console.error("❌ CREATE PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Lỗi tạo sản phẩm" });
  }
});

/* ======================================
   GET 1 PRODUCT
====================================== */
router.get("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.userId,
    })
      .populate("categoryId", "name")
      .populate("brandId", "name")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT /api/seller/products/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.userId,
    });

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    // Lấy payload từ req.body
    const allowedFields = ["name", "price", "stock", "categoryId", "brandId", "sku", "tags", "isActive", "isFeatured"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* ======================================
   UPLOAD IMAGES
====================================== */
router.post("/:id/images", auth, upload.array("images", 10), async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.userId,
    });

    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const uploaded = req.files.map((f) => ({
      url: `/assets/products/${f.filename}`,
      alt: "",
    }));

    product.images = [...product.images, ...uploaded];
    await product.save();

    res.json({
      success: true,
      message: "Upload ảnh thành công",
      product,
    });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ======================================
   VARIANTS CRUD
====================================== */

// Lấy danh sách biến thể theo productId
router.get("/:productId/variants", auth, async (req, res) => {
  try {
    const variants = await Variant.find({ productId: req.params.productId });
    res.json({ success: true, variants });
  } catch (err) {
    console.error("GET VARIANTS ERROR", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/:productId/variants", auth, async (req, res) => {
  try {
    const { sku, size, color, price, comparePrice, stock } = req.body;

    if (!sku || !size || !color || !price || !stock)
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

    const variant = await Variant.create({
      productId: req.params.productId,
      sku,
      size,
      color,
      price,
      comparePrice,
      stock,
    });

    res.json({ success: true, variant });
  } catch (err) {
    console.error("CREATE VARIANT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/:productId/variants/:variantId", auth, async (req, res) => {
  try {
    const variant = await Variant.findOneAndUpdate(
      { _id: req.params.variantId, productId: req.params.productId },
      req.body,
      { new: true }
    );

    if (!variant) return res.status(404).json({ message: "Variant không tồn tại" });

    res.json({ success: true, variant });
  } catch (err) {
    console.error("UPDATE VARIANT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:productId/variants/:variantId", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      seller: req.userId,
    });

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    const variant = product.variants.id(req.params.variantId);

    if (!variant)
      return res.status(404).json({ success: false, message: "Variant not found" });

    variant.deleteOne();
    await product.save();

    res.json({ success: true, message: "Variant deleted" });
  } catch (err) {
    console.error("DELETE VARIANT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// DELETE /api/seller/products/:id
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.userId; // lấy từ auth

    if (!productId) {
      return res.status(400).json({ message: "Thiếu productId" });
    }

    // Kiểm tra product có tồn tại không
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // KIỂM TRA QUYỀN SỞ HỮU
    if (product.seller.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa sản phẩm này" });
    }

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      message: "Xóa sản phẩm thành công",
      deletedId: productId,
    });
  } catch (error) {
    console.log("DELETE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm" });
  }
});

/* ======================================
   UPLOAD IMAGES CHO SẢN PHẨM
====================================== */
router.post("/:id/images", auth, upload.array("images", 10), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.userId });
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }

    const uploadedImages = req.files.map((f) => ({
      url: `/assets/products/${f.filename}`,
      alt: "",
    }));

    product.images = [...(product.images || []), ...uploadedImages];
    await product.save();

    res.json({ success: true, message: "Upload ảnh thành công", product });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);
    res.status(500).json({ message: "Lỗi server khi upload ảnh" });
  }
});

module.exports = router;
