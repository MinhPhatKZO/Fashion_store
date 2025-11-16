const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

/* ==============================
   🧭 1. Dashboard Statistics
================================ */
router.get('/statistics', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ==============================
   👥 2. Manage Users & Sellers
================================ */
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.query; // ?role=user hoặc seller
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    res.json({ message: 'User role updated', user: updatedUser });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Kiểm tra role hợp lệ
    if (!['user', 'seller'].includes(role)) {
      return res.status(400).json({ message: "Chỉ được set role 'user' hoặc 'seller'" });
    }

    // Lấy user cần thay đổi
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Không cho đổi role của admin khác
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Không thể đổi role của admin' });
    }

    // Cập nhật role
    targetUser.role = role;
    await targetUser.save();

    res.json({ 
      message: 'Cập nhật role thành công', 
      user: { id: targetUser._id, name: targetUser.name, role: targetUser.role } 
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/promotions', auth, adminAuth, async (req, res) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/promotions',
  auth,
  adminAuth,
  [
    body('code').notEmpty(),
    body('description').optional(),
    body('discountPercent').isNumeric(),
    body('startDate').notEmpty(),
    body('endDate').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const promo = new Promotion(req.body);
      await promo.save();
      res.status(201).json(promo);
    } catch (error) {
      console.error('Create promotion error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put('/promotions/:id', auth, adminAuth, async (req, res) => {
  try {
    const updated = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/promotions/:id/toggle', auth, adminAuth, async (req, res) => {
  try {
    const promo = await Promotion.findById(req.params.id);
    promo.active = !promo.active;
    await promo.save();
    res.json(promo);
  } catch (error) {
    console.error('Toggle promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/promotions/:id', auth, adminAuth, async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promotion deleted' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: GET /admin/seller-revenue
router.get('/seller-revenue', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    // groupBy = 'month' | 'year' | undefined

    // Build filter đơn hàng hoàn thành
    let matchFilter = { status: 'completed' };
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    // Stage group tùy theo yêu cầu
    let groupStage = {
      _id: "$seller",
      totalRevenue: { $sum: "$totalPrice" },
      totalOrders: { $sum: 1 }
    };

    if (groupBy === 'month') {
      groupStage._id = {
        seller: "$seller",
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
    } else if (groupBy === 'year') {
      groupStage._id = {
        seller: "$seller",
        year: { $year: "$createdAt" }
      };
    }

    const revenueBySeller = await Order.aggregate([
      { $match: matchFilter },
      { $group: groupStage },
      {
        $lookup: {
          from: "users",
          localField: groupBy ? "_id.seller" : "_id",
          foreignField: "_id",
          as: "sellerInfo"
        }
      },
      { $unwind: "$sellerInfo" },
      {
        $project: {
          sellerId: groupBy ? "$_id.seller" : "$_id",
          sellerName: "$sellerInfo.name",
          sellerEmail: "$sellerInfo.email",
          year: groupBy ? "$_id.year" : undefined,
          month: groupBy ? "$_id.month" : undefined,
          totalRevenue: 1,
          totalOrders: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(revenueBySeller);

  } catch (error) {
    console.error("Get seller revenue error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
