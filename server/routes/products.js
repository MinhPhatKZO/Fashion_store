const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brands");
const Category = require("../models/Category");
const Variant = require("../models/Variants");
const router = express.Router();

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

/**
 * Chuyển query param thành mảng string sạch sẽ
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
 * Chuyển mảng string ID thành mảng ObjectId hợp lệ của MongoDB
 */
const toObjectIds = (arr) => {
  return arr
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

// ==========================================
// 2. ROUTES
// ==========================================

/**
 * @route   GET /api/products
 * @desc    Lấy danh sách sản phẩm (Filter, Search, Pagination, Sort)
 */
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

    // Chỉ lấy sản phẩm đang hoạt động
    const query = { isActive: true };
    let sortCriteria = { createdAt: -1 };

    // 1. Tìm kiếm
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // 2. Lọc theo Category
    const categoryIds = parseQueryToArray(category);
    if (categoryIds.length > 0) {
      query.categoryId = { $in: toObjectIds(categoryIds) };
    }

    // 3. Lọc theo Brand
    const brandIds = parseQueryToArray(brand);
    if (brandIds.length > 0) {
      query.brandId = { $in: toObjectIds(brandIds) };
    }

    // 4. Lọc theo Giá
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 5. Sắp xếp
    if (sort === "price-asc") sortCriteria = { price: 1 };
    else if (sort === "price-desc") sortCriteria = { price: -1 };
    else if (sort === "name-asc") sortCriteria = { name: 1 };

    // 6. Thực thi query
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortCriteria)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("categoryId", "name slug")
        .populate("brandId", "name logoUrl country"), // Lấy đủ info brand
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

/**
 * @route   GET /api/products/filters
 * @desc    Lấy dữ liệu để render bộ lọc (Categories & Brands)
 */
router.get("/filters", async (req, res) => {
  try {
    const categories = await Category.find({}, "_id name slug");
    const brands = await Brand.find({}, "_id name logoUrl");
    res.json({ categories, brands });
  } catch (error) {
    console.error("Error fetching filters:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/products/featured
 * @desc    Lấy sản phẩm nổi bật
 */
router.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({
      isFeatured: true, // Phải là nổi bật
      isActive: true,   // VÀ phải đang hoạt động
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("categoryId", "name slug")
      .populate("brandId", "name logoUrl");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Lấy chi tiết 1 sản phẩm
 */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "ID sản phẩm không hợp lệ" });
    }

    const product = await Product.findOne({ 
        _id: req.params.id, 
        isActive: true // Quan trọng: Không cho xem sản phẩm đã ẩn
    })
      .populate("categoryId", "name description")
      .populate("brandId", "name logoUrl country description"); // Lấy chi tiết brand để hiển thị

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại hoặc đã bị ẩn" });
    }

    res.json({ product });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * @route   GET /api/products/related/:id
 * @desc    Lấy sản phẩm liên quan (Cùng Brand trước, sau đó cùng Category)
 */
router.get("/related/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const LIMIT = 8;

    const current = await Product.findById(id).select("brandId categoryId isActive");
    if (!current) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    let related = [];
    // Mảng chứa các ID đã lấy để tránh trùng lặp
    const excludedIds = [new mongoose.Types.ObjectId(id)];

    // 1. Ưu tiên cùng Brand
    if (current.brandId) {
      const sameBrand = await Product.find({
        _id: { $ne: id },
        isActive: true,
        brandId: current.brandId,
      })
        .limit(LIMIT)
        .select("_id name price images description brandId")
        .populate("brandId", "name")
        .sort({ createdAt: -1 });

      related = [...sameBrand];
      sameBrand.forEach((p) => excludedIds.push(p._id));
    }

    // 2. Nếu chưa đủ số lượng, lấy thêm cùng Category
    if (related.length < LIMIT && current.categoryId) {
      const needed = LIMIT - related.length;
      const sameCategory = await Product.find({
        _id: { $nin: excludedIds }, // Trừ những cái đã lấy ở trên
        isActive: true,
        categoryId: current.categoryId,
      })
        .limit(needed)
        .select("_id name price images description brandId")
        .populate("brandId", "name")
        .sort({ createdAt: -1 });

      related = [...related, ...sameCategory];
    }

    res.json({ relatedProducts: related });
  } catch (error) {
    console.error("Lỗi lấy sản phẩm liên quan:", error);
    res.status(500).json({ message: "Lỗi server khi tải sản phẩm liên quan" });
  }
});

/**
 * @route   GET /api/products/:id/variants
 * @desc    Lấy biến thể của sản phẩm
 */
router.get("/:id/variants", async (req, res) => {
  try {
    const productId = req.params.id;
    const variants = await Variant.find({ productId: productId })
      .select("_id size color price stock comparePrice sku")
      .lean();

    res.status(200).json({ variants });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm biến thể sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server khi tải biến thể", error: error.message });
  }
});

/**
 * @route   POST /api/products/cart-items
 * @desc    Lấy thông tin chi tiết cho giỏ hàng (từ mảng IDs)
 */
router.post("/cart-items", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const validObjectIds = toObjectIds(productIds); // Sử dụng helper

    if (validObjectIds.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const products = await Product.find({ 
        _id: { $in: validObjectIds },
        isActive: true // Chỉ lấy sp còn hoạt động
    })
      .select("_id name price images stock brandId categoryId")
      .populate("brandId", "name logoUrl") // Populate logo để hiển thị trong giỏ
      .populate("categoryId", "name")
      .lean();

    res.json({ items: products });
  } catch (error) {
    console.error("Lỗi chi tiết khi lấy sản phẩm giỏ hàng:", error);
    res.status(500).json({
      message: "Lỗi server khi tải chi tiết giỏ hàng",
      error: error.message,
    });
  }
});

module.exports = router;