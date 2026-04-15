const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User'); 
const mongoose = require("mongoose");
const { auth } = require('../middleware/auth');

const router = express.Router();

// --- LOAD MODEL BRAND (Để hỗ trợ tìm kiếm) ---
let Brand;
try {
    Brand = mongoose.models.Brand || require("../models/Brand");
} catch (e) {
    const BrandSchema = new mongoose.Schema({ 
        userId: mongoose.Schema.Types.ObjectId, 
        sellerId: mongoose.Schema.Types.ObjectId,
        name: String
    }, { strict: false });
    Brand = mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
}

// ==================================================================
// 1. PUBLIC: Lấy danh sách review của 1 sản phẩm
// ==================================================================
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isActive: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================================================================
// 2. PRIVATE: Lấy danh sách review cho Seller Dashboard
// ==================================================================
router.get('/seller', auth, async (req, res) => {
  try {
    let userId = null;
    if (req.user) userId = req.user._id || req.user.id;
    else if (req.userId) userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 1. Lấy thông tin Seller
    const currentUser = await User.findById(userId);
    
    //  AUTO-FIX: Nếu User thiếu BrandId thì tự tìm lại (Giữ lại để an toàn)
    if (currentUser && !currentUser.brandId) {
        // console.log(` Seller chưa có BrandId. Đang tìm lại...`);
        const myBrand = await Brand.findOne({ 
            $or: [{ userId: currentUser._id }, { sellerId: currentUser._id }] 
        });
        if (myBrand) {
            currentUser.brandId = myBrand._id;
            await currentUser.save();
        } else {
            // Nếu không có Brand thì không có sản phẩm -> trả về rỗng
            return res.status(200).json([]);
        }
    }

    if (!currentUser || !currentUser.brandId) return res.status(200).json([]);

    /* ĐOẠN CODE "VƠ VÉT" SẢN PHẨM ĐÃ ĐƯỢC TẮT ĐỂ AN TOÀN DỮ LIỆU
       (Chỉ bật lại khi cần sửa lỗi dữ liệu hàng loạt)
    */
    // const orphanProducts = await Product.countDocuments({ $or: [{ brand: { $exists: false } }, { brand: null }] });
    // if (orphanProducts > 0) {
    //     await Product.updateMany(
    //         { $or: [{ brand: { $exists: false } }, { brand: null }] },
    //         { $set: { brand: currentUser.brandId } }
    //     );
    // }

    // 2. Tìm ID các sản phẩm thuộc Brand này
    // Lưu ý: Trường trong Product là 'brand', không phải 'brandId'
    const products = await Product.find({ brand: currentUser.brandId }).select('_id');
    const productIds = products.map(p => p._id);

    if (productIds.length === 0) {
        return res.status(200).json([]);
    }

    // 3. Tìm Review thuộc các sản phẩm đó
    const reviews = await Review.find({ product: { $in: productIds } })
      .populate('user', 'name avatar email')
      .populate('product', 'name images') // Populate để lấy ảnh và tên sp hiển thị
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (error) {
    console.error('Get seller reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================================================================
// 3. PRIVATE: Gửi đánh giá mới (Cho Khách hàng)
// ==================================================================
router.post('/', auth, [
  body('product').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').trim().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let userId = req.user ? (req.user._id || req.user.id) : req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { product, rating, comment } = req.body;
    
    // Kiểm tra xem đã đánh giá chưa
    const existing = await Review.findOne({ user: userId, product });
    if (existing) return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });

    const review = new Review({ 
        user: userId, 
        product, 
        rating, 
        comment, 
        isActive: true 
    });
    
    await review.save();
    await review.populate('user', 'name avatar'); // Populate để frontend hiển thị ngay

    res.status(201).json({ message: 'Thành công', review });
  } catch (error) {
    console.error("Post review error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;