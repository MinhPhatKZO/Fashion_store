// product route (Giữ nguyên các require)
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brands");
const Category = require("../models/Category");

const router = express.Router();

/**
 * Hàm tiện ích: chuyển query param thành mảng string (Giữ nguyên)
 */
const parseQueryToArray = (queryParam) => {
  if (!queryParam) return [];
  if (Array.isArray(queryParam)) return queryParam;
  if (typeof queryParam === "string") {
    return queryParam.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Hàm tiện ích: chuyển các ID string thành ObjectId hợp lệ (Giữ nguyên)
 */
const toObjectIds = (arr) => {
  return arr
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

// 🎯 Route: Lấy danh sách sản phẩm (có lọc, phân trang, tìm kiếm)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sort,
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { isActive: true };
    let sortCriteria = { createdAt: -1 };

    // 🔍 Tìm kiếm theo tên sản phẩm
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // 🏷️ Lọc theo danh mục
    const categoryIds = parseQueryToArray(category);
    if (categoryIds.length > 0) {
      // 💡 ĐÃ SỬA: Dùng categoryId trong truy vấn
      query.categoryId = { $in: toObjectIds(categoryIds) };
    }

    // 🏷️ Lọc theo thương hiệu
    const brandIds = parseQueryToArray(brand);
    if (brandIds.length > 0) {
      // 💡 ĐÃ SỬA: Dùng brandId trong truy vấn
      query.brandId = { $in: toObjectIds(brandIds) };
    }

    // 💰 Lọc theo giá
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 📦 Sắp xếp
    if (sort === "price-asc") sortCriteria = { price: 1 };
    else if (sort === "price-desc") sortCriteria = { price: -1 };
    else if (sort === "name-asc") sortCriteria = { name: 1 };

    console.log("👉 Final query:", query);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortCriteria)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        // 💡 ĐÃ SỬA: Populate categoryId và brandId
        .populate("categoryId", "name slug") 
        .populate("brandId", "name logoUrl"),
      Product.countDocuments(query),
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
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Route: Lấy dữ liệu filter (categories + brands) - Giữ nguyên
router.get("/filters", async (req, res) => {
  try {
    const categories = await Category.find({}, "_id name slug");
    const brands = await Brand.find({}, "_id name");

    res.json({ categories, brands });
  } catch (error) {
    console.error("Error fetching filters:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Route: Lấy sản phẩm nổi bật
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ isFeatured: true }, { isActive: true }],
    })
      .sort({ createdAt: -1 })
      .limit(8)
      // 💡 ĐÃ SỬA: Populate categoryId và brandId
      .populate("categoryId", "name slug")
      .populate("brandId", "name logoUrl");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ==== LẤY CHI TIẾT SẢN PHẨM ====
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      // 💡 ĐÃ SỬA: Populate categoryId và brandId
      .populate("categoryId", "name description")
      .populate("brandId", "name logoUrl"); 

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    res.json({ product });
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ✅ Route: Lấy sản phẩm liên quan (Ưu tiên Brand, sau đó Category, giới hạn 7)
router.get("/related/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const LIMIT = 7;

    // Lấy ID của brand và category
    // 💡 ĐÃ SỬA: Chọn brandId và categoryId
    const current = await Product.findById(id).select("brandId categoryId isActive");
    if (!current) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    let related = [];
    const excludedIds = [new mongoose.Types.ObjectId(id)]; 

    // 1. --- Ưu tiên theo thương hiệu ---
    // 💡 ĐÃ SỬA: Dùng current.brandId
    if (current.brandId) {
      related = await Product.find({
        _id: { $ne: id }, 
        isActive: true,
        // 💡 ĐÃ SỬA: Truy vấn theo brandId
        brandId: current.brandId, 
      })
        .limit(LIMIT)
        .select("_id name price images description")
        .sort({ createdAt: -1 });

      // Thêm các ID đã lấy vào danh sách loại trừ
      related.forEach((p) => excludedIds.push(p._id));
    }

    // 2. --- Nếu chưa đủ thì lấy theo category ---
    // 💡 ĐÃ SỬA: Dùng current.categoryId
    if (related.length < LIMIT && current.categoryId) {
      const needed = LIMIT - related.length;
      const more = await Product.find({
        _id: { $nin: excludedIds }, 
        isActive: true,
        // 💡 ĐÃ SỬA: Truy vấn theo categoryId
        categoryId: current.categoryId, 
      })
        .limit(needed)
        .select("_id name price images description")
        .sort({ createdAt: -1 });

      related = [...related, ...more];
    }

    res.json({ relatedProducts: related });
  } catch (error) {
    console.error("❌ Lỗi lấy sản phẩm liên quan:", error);
    res.status(500).json({ message: "Lỗi server khi tải sản phẩm liên quan" });
  }
});

module.exports = router;