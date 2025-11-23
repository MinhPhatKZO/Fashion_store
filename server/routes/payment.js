const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
// Lưu ý: Cần thêm logic để tạo PaymentEvent nếu bạn muốn lưu chi tiết giao dịch

const router = express.Router();

// -------------------------------------------------------------
// @route   POST /api/payment/create-payment-intent
// -------------------------------------------------------------
router.post('/create-payment-intent', auth, [
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;

    // ✅ SỬA LỖI 1: Thay 'user' bằng 'userId'
    const order = await Order.findOne({ _id: orderId, userId: req.userId }); 
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // ✅ SỬA LỖI 2: Dùng trường 'status' thay vì 'paymentStatus' (và thêm 'unconfirmed')
    if (order.status !== 'pending' && order.status !== 'unconfirmed') {
      return res.status(400).json({ message: 'Order payment already processed or cannot be paid' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      // ✅ SỬA LỖI 3: Thay 'order.total' bằng 'order.totalPrice'
      amount: Math.round(order.totalPrice * 100), // Convert to cents
      currency: 'vnd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.userId.toString()
      }
    });
    
    // ✅ THÊM: Cập nhật trạng thái sang 'unconfirmed' sau khi tạo intent thành công
    order.status = 'unconfirmed';
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

// -------------------------------------------------------------
// @route   POST /api/payment/confirm
// -------------------------------------------------------------
router.post('/confirm', auth, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, orderId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Update order
    const order = await Order.findOneAndUpdate(
      // ✅ SỬA LỖI 1: Thay 'user' bằng 'userId'
      { _id: orderId, userId: req.userId },
      {
        // ✅ SỬA LỖI 4: Chỉ cập nhật 'status' chính. Loại bỏ các trường paymentStatus/paymentDetails
        status: 'processing' // 'confirmed' nên đổi thành 'processing' để phù hợp với enum
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // TODO: Ghi lại giao dịch vào PaymentEvent (nên làm ở Webhook để đảm bảo tính cuối cùng)

    res.json({
      message: 'Payment confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Payment confirmation failed' });
  }
});

// -------------------------------------------------------------
// @route   POST /api/payment/webhook
// -------------------------------------------------------------
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // 
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
    
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // ✅ SỬA LỖI 5: Chỉ cập nhật 'status'. Tìm đơn hàng bằng OrderId từ metadata
      await Order.findByIdAndUpdate(
        paymentIntent.metadata.orderId,
        { status: 'processing' } 
      );
      // TODO: Tạo PaymentEvent tại đây
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      // ✅ SỬA LỖI 5: Chỉ cập nhật 'status'. Tìm đơn hàng bằng OrderId từ metadata
      await Order.findByIdAndUpdate(
        failedPayment.metadata.orderId,
        { status: 'cancelled' } 
      );
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;