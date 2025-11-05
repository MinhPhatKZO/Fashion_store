// server/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true, // ⚡ chỉ giữ unique, bỏ index: true
      trim: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: String,
    shippingAddress: String,
    notes: String,
  },
  { timestamps: true }
);

// ✅ Chỉ tạo index 1 lần
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);

