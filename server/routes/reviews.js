const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const filter = { product: req.params.productId, isActive: true };
    
    if (rating) filter.rating = Number(rating);

    const skip = (page - 1) * limit;

    const reviews = await Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    // Get rating statistics
    const stats = await Review.aggregate([
      { $match: { product: req.params.productId, isActive: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const ratingStats = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };

    stats.forEach(stat => {
      ratingStats[stat._id] = stat.count;
    });

    res.json({
      reviews,
      ratingStats,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create new review
// @access  Private
router.post('/', auth, [
  body('product').isMongoId().withMessage('Valid product ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 1 }).withMessage('Review comment is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product, rating, title, comment, images, pros, cons, order } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ user: req.userId, product });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Verify order if provided
    if (order) {
      const orderExists = await Order.findOne({
        _id: order,
        user: req.userId,
        status: 'delivered',
        'items.product': product
      });
      if (!orderExists) {
        return res.status(400).json({ message: 'Invalid order or product not delivered' });
      }
    }

    const review = new Review({
      user: req.userId,
      product,
      rating,
      title,
      comment,
      images,
      pros,
      cons,
      order,
      isVerified: !!order
    });

    await review.save();

    await review.populate('user', 'name avatar');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private
router.put('/:id', auth, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ min: 1 }).withMessage('Review comment is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findOne({ _id: req.params.id, user: req.userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const { rating, title, comment, images, pros, cons } = req.body;
    const updateData = {};

    if (rating) updateData.rating = rating;
    if (title !== undefined) updateData.title = title;
    if (comment) updateData.comment = comment;
    if (images) updateData.images = images;
    if (pros) updateData.pros = pros;
    if (cons) updateData.cons = cons;

    Object.assign(review, updateData);
    await review.save();

    await review.populate('user', 'name avatar');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await Review.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userIndex = review.helpful.users.indexOf(req.userId);
    if (userIndex > -1) {
      // Remove helpful vote
      review.helpful.users.splice(userIndex, 1);
      review.helpful.count -= 1;
    } else {
      // Add helpful vote
      review.helpful.users.push(req.userId);
      review.helpful.count += 1;
    }

    await review.save();

    res.json({
      message: 'Helpful vote updated',
      helpful: review.helpful
    });
  } catch (error) {
    console.error('Helpful vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

