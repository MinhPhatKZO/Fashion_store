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

/* ==============================
   🎟 3. Manage Promotions
================================ */
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

/* ==============================
   🧾 4. Manage Orders
================================ */
router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/orders/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
