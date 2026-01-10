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

const parseQueryToArray = (queryParam) => {
  if (!queryParam) return [];
  if (Array.isArray(queryParam)) return queryParam;
  if (typeof queryParam === "string") {
    return queryParam.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

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
 * @desc    Lấy TOÀN BỘ danh sách sản phẩm (Bỏ phân trang)
 */
router.get("/", async (req, res) => {
  try {
    const {
      // page, limit, // ❌ ĐÃ BỎ: Không lấy page và limit từ query nữa
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sort,
    } = req.query;

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
      query.brand = { $in: toObjectIds(brandIds) };
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

    // 6. Thực thi query (LẤY HẾT - KHÔNG LIMIT)
    const products = await Product.find(query)
      .sort(sortCriteria)
      // .skip(...) ❌ ĐÃ BỎ SKIP
      // .limit(...) ❌ ĐÃ BỎ LIMIT
      .populate("categoryId", "name slug")
      .populate("brand", "name logoUrl country");

    const total = products.length;

    res.json({
      products,
      // Trả về pagination giả để Frontend không bị lỗi nếu đang dùng biến này
      pagination: {
        current: 1,
        pages: 1,
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
 * @desc    Lấy dữ liệu để render bộ lọc
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
      isFeatured: true,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(8) // Vẫn giữ limit cho Featured để giao diện đẹp
      .populate("categoryId", "name slug")
      .populate("brand", "name logoUrl");
    res.json({ products });
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
        isActive: true 
    })
      .populate("categoryId", "name description")
      .populate("brand", "name logoUrl country description")
      .populate("seller", "name avatar");

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
 * @desc    Lấy sản phẩm liên quan
 */
router.get("/related/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const LIMIT = 8;

    const current = await Product.findById(id).select("brand categoryId isActive");
    if (!current) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    let related = [];
    const excludedIds = [new mongoose.Types.ObjectId(id)];

    // 1. Ưu tiên cùng Brand
    if (current.brand) {
      const sameBrand = await Product.find({
        _id: { $ne: id },
        isActive: true,
        brand: current.brand,
      })
        .limit(LIMIT)
        .select("_id name price images description brand")
        .populate("brand", "name")
        .sort({ createdAt: -1 });

      related = [...sameBrand];
      sameBrand.forEach((p) => excludedIds.push(p._id));
    }

    // 2. Nếu chưa đủ số lượng, lấy thêm cùng Category
    if (related.length < LIMIT && current.categoryId) {
      const needed = LIMIT - related.length;
      const sameCategory = await Product.find({
        _id: { $nin: excludedIds },
        isActive: true,
        categoryId: current.categoryId,
      })
        .limit(needed)
        .select("_id name price images description brand")
        .populate("brand", "name")
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
 * @desc    Lấy thông tin chi tiết cho giỏ hàng
 */
router.post("/cart-items", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const validObjectIds = toObjectIds(productIds);

    if (validObjectIds.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const products = await Product.find({ 
        _id: { $in: validObjectIds },
        isActive: true 
    })
      .select("_id name price images stock brand categoryId")
      .populate("brand", "name logoUrl")
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