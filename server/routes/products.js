const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

//lấy tất cả sản phẩm
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments({ isActive: true }),
    ]);

    res.json({
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error(" Get products error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//lấy sản phẩm nổi bật
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ isFeatured: true }, { isActive: true }],
    })
      .sort({ createdAt: -1 })
      .limit(8);

    console.log("Featured products count:", products.length);
    res.json(products);
  } catch (error) {
    console.error("Get featured products error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//lấy chi tiết sản phẩm
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    // tăng lượt xem
    await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

    res.json({ product });
  } catch (error) {
    console.error("Get product detail error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
