// productRoutes.js (Code đầy đủ, bao gồm cả các route khác)

const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brands");
const Category = require("../models/Category");
const Variant = require("../models/Variants");
const router = express.Router();

/**
 * Hàm tiện ích: chuyển query param thành mảng string
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
 * Hàm tiện ích: chuyển các ID string thành ObjectId hợp lệ
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

        const query = { isActive: true };
        let sortCriteria = { createdAt: -1 };

        if (search && search.trim() !== "") {
            query.name = { $regex: search.trim(), $options: "i" };
        }

        const categoryIds = parseQueryToArray(category);
        if (categoryIds.length > 0) {
            query.categoryId = { $in: toObjectIds(categoryIds) };
        }

        const brandIds = parseQueryToArray(brand);
        if (brandIds.length > 0) {
            query.brandId = { $in: toObjectIds(brandIds) };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (sort === "price-asc") sortCriteria = { price: 1 };
        else if (sort === "price-desc") sortCriteria = { price: -1 };
        else if (sort === "name-asc") sortCriteria = { name: 1 };

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort(sortCriteria)
                .skip((page - 1) * limit)
                .limit(Number(limit))
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

// ✅ Route: Lấy dữ liệu filter (categories + brands)
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

// ✅ Route: Lấy sản phẩm liên quan
router.get("/related/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const LIMIT = 7;

        const current = await Product.findById(id).select("brandId categoryId isActive");
        if (!current) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        let related = [];
        const excludedIds = [new mongoose.Types.ObjectId(id)]; 

        if (current.brandId) {
            related = await Product.find({
                _id: { $ne: id }, 
                isActive: true,
                brandId: current.brandId, 
            })
                .limit(LIMIT)
                .select("_id name price images description")
                .sort({ createdAt: -1 });

            related.forEach((p) => excludedIds.push(p._id));
        }

        if (related.length < LIMIT && current.categoryId) {
            const needed = LIMIT - related.length;
            const more = await Product.find({
                _id: { $nin: excludedIds }, 
                isActive: true,
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
// productRoutes.js (ROUTE VARIANTS)

router.get('/:id/variants', async (req, res) => {
    try {
        const productId = req.params.id; 
        
        const variants = await Variant.find({ productId: productId })
            .select('_id size color price stock comparePrice sku')
            .lean();

        res.status(200).json({ 
            variants: variants 
        });

    } catch (error) {
        console.error("❌ Lỗi khi tìm kiếm biến thể sản phẩm:", error);
        res.status(500).json({ message: 'Lỗi server khi tải biến thể', error: error.message });
    }
});
// 🎯 Route: Lấy thông tin chi tiết nhiều sản phẩm cho Giỏ hàng
router.post("/cart-items", async (req, res) => {
    try {
        const { productIds } = req.body; 
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(200).json({ items: [] });
        }
        
        const validObjectIds = productIds
            .filter(id => id && mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        if (validObjectIds.length === 0) {
             return res.status(200).json({ items: [] });
        }

        const products = await Product.find({ _id: { $in: validObjectIds } })
            .select("_id name price images stock brandId categoryId") 
            .populate("brandId", "name") 
            .populate("categoryId", "name") 
            .lean(); 

        res.json({ items: products });
    } catch (error) {
        console.error("❌ Lỗi chi tiết khi lấy sản phẩm giỏ hàng:", error); 
        res.status(500).json({ 
            message: "Lỗi server khi tải chi tiết giỏ hàng", 
            error: error.message,
        });
    }
});
module.exports = router;