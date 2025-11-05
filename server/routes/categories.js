const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET all active categories, tự động có children do virtual populate
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Các route khác (POST, PUT, DELETE) giữ nguyên như cũ...

module.exports = router;
