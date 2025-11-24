const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../../models/Product");
const { auth, sellerAuth } = require("../../middleware/auth");

const router = express.Router();

// =======================
// MULTER CONFIG FOR IMAGE UPLOAD
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "../web/public/assets/products"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// =======================
// GET ALL PRODUCTS (SELLER)
// =======================
router.get("/", auth, sellerAuth, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm", error });
  }
});

// =======================
// CREATE PRODUCT (SINGLE IMAGE)
// =======================
router.post("/", auth, sellerAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!name || !price) return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });

    const productData = { name, price: Number(price), description, userId: req.userId };

    if (req.file) {
      productData.images = [{ url: `/assets/products/${req.file.filename}`, alt: "" }];
    }

    const product = new Product(productData);
    await product.save();

    res.json({ message: "Tạo sản phẩm thành công", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi tạo sản phẩm", error });
  }
});

/* =======================
   GET SINGLE PRODUCT (SELLER)
======================= */
router.get("/:id", auth, sellerAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy sản phẩm", error });
  }
});


// =======================
// UPDATE PRODUCT
// =======================
router.put("/:id", auth, sellerAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    res.json({ message: "Cập nhật thành công", product });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật sản phẩm", error });
  }
});

// =======================
// DELETE PRODUCT
// =======================
router.delete("/:id", auth, sellerAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa sản phẩm", error });
  }
});

// =======================
// UPLOAD MULTIPLE IMAGES
// =======================
router.post("/:id/images", auth, sellerAuth, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files) return res.status(400).json({ message: "Không có ảnh để upload" });

    const files = req.files.map(file => ({
      url: `/assets/products/${file.filename}`,
      alt: req.body.alt || "",
    }));

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user_id: req.userId },
      { $push: { images: { $each: files } } },
      { new: true }
    );

    res.json({ message: "Tải ảnh thành công", product });
  } catch (error) {
    res.status(500).json({ message: "Lỗi upload ảnh", error });
  }
});
/* =======================
   GET ALL VARIANTS CỦA 1 PRODUCT
======================= */
router.get("/:productId/variants", auth, sellerAuth, async (req, res) => {
  try {
    const variants = await Variant.find({ productId: req.params.productId });
    res.json({ data: variants });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy variants", error });
  }
});

/* =======================
   ADD VARIANT
======================= */
router.post("/:productId/variants", auth, sellerAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, userId: req.userId });
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const variantData = {
      ...req.body,
      productId: req.params.productId
    };

    const variant = new Variant(variantData);
    await variant.save();

    res.json({ message: "Thêm biến thể thành công", variant });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm biến thể", error });
  }
});

/* =======================
   UPDATE VARIANT
======================= */
router.put("/:productId/variants/:variantId", auth, sellerAuth, async (req, res) => {
  try {
    const variant = await Variant.findOneAndUpdate(
      { _id: req.params.variantId, productId: req.params.productId },
      req.body,
      { new: true }
    );

    if (!variant) return res.status(404).json({ message: "Không tìm thấy biến thể" });

    res.json({ message: "Cập nhật biến thể thành công", variant });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật biến thể", error });
  }
});

/* =======================
   DELETE VARIANT
======================= */
router.delete("/:productId/variants/:variantId", auth, sellerAuth, async (req, res) => {
  try {
    const variant = await Variant.findOneAndDelete({
      _id: req.params.variantId,
      productId: req.params.productId,
    });

    if (!variant) return res.status(404).json({ message: "Không tìm thấy biến thể" });

    res.json({ message: "Xóa biến thể thành công", variant });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa biến thể", error });
  }
});
module.exports = router;
