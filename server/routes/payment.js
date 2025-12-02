const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// -------------------------------------------------------------
//  /api/payment/create-payment-intent
// -------------------------------------------------------------
  router.post('/create-payment-intent', auth, [
    body('orderId').isMongoId().withMessage('Xac thuc yeu cau cua OrderID') //
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, userId: req.userId }); 
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn' });
    }
    
    if (order.status !== 'pending' && order.status !== 'unconfirmed') {
      return res.status(400).json({ message: 'Đã thanh toán hoặc không thể thanh toán' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // đổi thành tiền vnd
      currency: 'vnd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.userId.toString()
      }
    });
    
    order.status = 'unconfirmed';
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret, // trả về client secret để client gọi thanh toán
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Tạo payment intent lỗi:', error);
    res.status(500).json({ message: 'Xử lí thanh toán không thành công' });
  }
});


router.post('/confirm', auth, [
  body('paymentIntentId').notEmpty().withMessage('Xác nhận paymentIntentId hợp lệ'),
  body('orderId').isMongoId().withMessage('Xác nhận mã đơn hàng hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Thanh toán chưa hoàn tất' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, userId: req.userId },
      { status: 'processing' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Không tìm tháy đơn ' });
    }

    res.json({
      message: 'Payment confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Xác nhận thanh toán không thành công' });
  }
});

// xác minh chữ ký webhook từ stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); // xác minh chữ ký
  } catch (err) {
    console.error('Xác minh chữ ký webhook không thành công:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
    
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      await Order.findByIdAndUpdate(
        paymentIntent.metadata.orderId,
        { status: 'processing' } 
      );
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      await Order.findByIdAndUpdate(
        failedPayment.metadata.orderId,
        { status: 'cancelled' } 
      );
      break;
      
    default:
      console.log(`Sự kiện chưa được xử lí ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
