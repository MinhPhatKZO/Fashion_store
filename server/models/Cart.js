const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: {
    size: { type: String },
    color: { type: String }
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // snapshot giá khi thêm vào giỏ
  total: { type: Number, required: true }
}, { _id: false });

const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema],
  subTotal: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
