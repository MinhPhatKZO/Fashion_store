const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../../models/Product");
// Import sellerBrandAuth để xử lý logic 1 seller - 1 brand
const { auth, sellerBrandAuth } = require("../../middleware/auth");

const router = express.Router();

/* ============================
   MULTER CONFIG (Cấu hình upload ảnh)
=============================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Đường dẫn lưu ảnh: public/assets/products
    cb(null, path.join(__dirname, "../../../web/public/assets/products"));
  },
  filename: (req, file, cb) => {
    // Đặt tên file unique: timestamp-random.ext
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/* ============================
   1. GET ALL PRODUCTS
   - Lấy danh sách sản phẩm thuộc Brand của Seller
=============================== */
router.get("/", auth, sellerBrandAuth, async (req, res) => {
  try {
    // Sử dụng req.sellerBrandId từ middleware để lọc đúng sản phẩm
    const products = await Product.find({ brandId: req.sellerBrandId })
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
   2. CREATE PRODUCT
   - Tạo sản phẩm mới gắn với Brand của Seller
=============================== */
router.post("/", auth, sellerBrandAuth, async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      originalPrice,
      categoryId,
      subcategoryId,
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
      sku,
      stock,
      tags,
      // QUAN TRỌNG:
      brandId: req.sellerBrandId, // Tự động gán Brand của Seller
      seller: req.userId,         // Gán ID người tạo
      isActive: true,
      images: [] // Khởi tạo mảng ảnh rỗng, upload sau
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("❌ CREATE PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Lỗi tạo sản phẩm" });
  }
});

/* ============================
   3. GET PRODUCT DETAIL
=============================== */
router.get("/:id", auth, sellerBrandAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      brandId: req.sellerBrandId, // Chỉ xem được sp của brand mình
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

/* ============================
   4. UPDATE PRODUCT
=============================== */
router.put("/:id", auth, sellerBrandAuth, async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      price: req.body.price,
      originalPrice: req.body.originalPrice,
      stock: req.body.stock,
      description: req.body.description,
      categoryId: req.body.categoryId || null,
      subcategoryId: req.body.subcategoryId || null,
      tags: req.body.tags,
      isActive: req.body.isActive,
    };

    // Nếu frontend gửi mảng images mới (đã xử lý xóa/sắp xếp)
    if (req.body.images) {
      updateData.images = req.body.images;
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, brandId: req.sellerBrandId }, // Điều kiện an toàn
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

/* ============================
   5. UPLOAD IMAGES
   - Lưu ảnh dạng Object { url: "..." } để đồng bộ với DB cũ
=============================== */
router.post("/:id/images", auth, sellerBrandAuth, upload.array("images", 10), async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      brandId: req.sellerBrandId,
    });

    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // ✅ CHỈNH SỬA: Map sang Object structure khớp với products.json
    const newImages = req.files.map((f) => ({
      url: `/assets/products/${f.filename}`,
      alt: f.originalname || ""
    }));

    // Nối vào mảng cũ
    product.images = [...(product.images || []), ...newImages];

    await product.save();

    res.json({
      message: "Upload ảnh thành công",
      product,
      newImages // Trả về để FE hiển thị ngay
    });
  } catch (err) {
    console.error("UPLOAD IMAGE ERROR:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* ============================
   6. DELETE PRODUCT
=============================== */
router.delete("/:id", auth, sellerBrandAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      brandId: req.sellerBrandId,
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