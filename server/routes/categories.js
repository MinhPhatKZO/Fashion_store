const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const router = express.Router();

// GET tất cả category
router.get('/', async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// POST tạo category
router.post(
  '/',
  body('name').notEmpty().withMessage('Name required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const category = new Category({ name: req.body.name });
    await category.save();
    res.json(category);
  }
);

// PUT update category
router.put('/:id', async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true }
  );
  res.json(category);
});

// DELETE category
router.delete('/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ msg: 'deleted' });
});

module.exports = router;
