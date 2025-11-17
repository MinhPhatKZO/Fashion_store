const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.userId };
    
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate('items.product', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId })
      .populate('items.product', 'name images price')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
// Thêm 'momo' vào validate paymentMethod
router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('paymentMethod').isIn(['cod', 'credit_card', 'bank_transfer', 'wallet', 'momo']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Validate products & calculate totals
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) return res.status(400).json({ message: `Product ${item.product} not found or inactive` });

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        variant: item.variant,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    const shippingCost = subtotal > 500000 ? 0 : 30000;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shippingCost + tax;

    // Tạo order trong DB
    const order = new Order({ user: req.userId, items: orderItems, shippingAddress, paymentMethod, subtotal, shippingCost, tax, total, notes });
    await order.save();

    // Update stock
    for (const item of orderItems) {
      if (item.variant) {
        await Product.updateOne(
          { _id: item.product, 'variants.size': item.variant.size, 'variants.color': item.variant.color },
          { $inc: { 'variants.$.stock': -item.quantity } }
        );
      }
    }

    await order.populate('items.product', 'name images price');

    // Nếu chọn MoMo → gọi API MoMo
    if (paymentMethod === 'momo') {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const crypto = require('crypto');

      const partnerCode = process.env.MOMO_PARTNER_CODE;
      const accessKey = process.env.MOMO_ACCESS_KEY;
      const secretKey = process.env.MOMO_SECRET_KEY;
      const requestId = order._id.toString();
      const orderId = requestId;
      const orderInfo = `Thanh toán đơn ${order._id}`;
      const redirectUrl = process.env.MOMO_RETURN_URL;
      const ipnUrl = process.env.MOMO_NOTIFY_URL;
      const requestType = 'payWithMethod';
      const extraData = '';
      const lang = 'vi';

      const rawSignature = `accessKey=${accessKey}&amount=${total}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
      const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

      const requestBody = {
        partnerCode,
        partnerName: "YourStore",
        storeId: "Store001",
        requestId,
        amount: total.toString(),
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture: true,
        extraData,
        signature
      };

      const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const momoData = await response.json();

      return res.status(201).json({
        success: true,
        message: 'Order created, redirect to MoMo',
        data: { order, payUrl: momoData.payUrl }
      });
    }

    // Nếu không phải momo → trả về bình thường
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', auth, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.history.push({
      status: 'cancelled',
      note: reason || 'Order cancelled by user',
      updatedAt: new Date()
    });

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      if (item.variant) {
        await Product.updateOne(
          { _id: item.product, 'variants.size': item.variant.size, 'variants.color': item.variant.color },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      }
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

