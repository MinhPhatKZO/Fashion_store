const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Brand = require('../models/Brands');
const { auth, adminAuth } = require('../middleware/auth');


const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'seller']).withMessage('Role must be user or seller'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('brandId').optional().isMongoId().withMessage('brandId must be a valid MongoDB ObjectId'),
    body('storeName').optional().notEmpty().withMessage('Store name is required for seller'),
    body('storeAddress').optional().notEmpty().withMessage('Store address is required for seller')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      role = 'user',
      phone,
      address,
      brandId,
      storeName,
      storeAddress
    } = req.body;

    try {
      // Kiểm tra user đã tồn tại chưa
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Nếu là seller, bắt buộc brandId, storeName, storeAddress
      if (role === 'seller') {
        if (!brandId || !storeName || !storeAddress) {
          return res.status(400).json({ message: 'Seller must provide brandId, storeName, storeAddress' });
        }
        const brand = await Brand.findById(brandId);
        if (!brand) {
          return res.status(400).json({ message: 'Brand not found' });
        }
      }

      // Tạo user mới
      user = new User({
        name,
        email,
        password,
        role,
        phone,
        address,
        brandId: role === 'seller' ? brandId : null,
        storeName: role === 'seller' ? storeName : null,
        storeAddress: role === 'seller' ? storeAddress : null
      });

      await user.save();

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          brandId: user.brandId,
          storeName: user.storeName,
          storeAddress: user.storeAddress
        }
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      // 🔥 Return đúng format frontend cần
      const userResponse = {
        _id: user._id,          // FIXED !!!
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar
      };

      if (user.role === 'seller') {
        userResponse.storeName = user.storeName;
        userResponse.storeAddress = user.storeAddress;
        userResponse.brandId = user.brandId;
      }

      return res.json({
        message: 'Login successful',
        token,
        user: userResponse
      });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/all
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;