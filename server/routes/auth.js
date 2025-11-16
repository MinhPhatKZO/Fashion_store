const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
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
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user (password will be hashed by pre-save hook)
      user = new User({
        name,
        email,
        password,
        role: 'user' // Default role
      });

      await user.save();
      
      res.status(201).json({ 
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
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
      // Find user with password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Compare password using the model method
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      // Return user info based on role
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar
      };

      // Add seller specific fields if role is seller
      if (user.role === 'seller') {
        userResponse.storeName = user.storeName;
        userResponse.storeAddress = user.storeAddress;
        userResponse.brandId = user.brandId;
      }

      res.json({ 
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