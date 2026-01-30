const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  totalPrice: { type: Number, required: true },
  
  // 👉 TRẠNG THÁI ĐƠN HÀNG
  status: {
    type: String,
    enum: ["Pending_Payment", "Waiting_Approval", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending_Payment", // Mặc định là chờ thanh toán
  },
  
  paymentMethod: { type: String },
  shippingAddress: { type: String },
  notes: { type: String },
  isPaid: { type: Boolean, default: false }, // Đã thanh toán hay chưa
  paidAt: { type: Date },

  // 👉 CÁC TRƯỜNG MỚI THÊM (Dự kiến giao & Lời nhắn shop)
  estimatedDeliveryDate: { type: Date }, 
  sellerNote: { type: String },          

}, { timestamps: true });

// 👉 TÍNH NĂNG TỰ ĐỘNG XÓA ĐƠN RÁC (TTL Index)
// Nếu đơn hàng ở trạng thái 'Pending_Payment' quá 1 tiếng (3600s), MongoDB sẽ tự động xóa nó.
orderSchema.index({ createdAt: 1 }, { 
    expireAfterSeconds: 3600, 
    partialFilterExpression: { status: "Pending_Payment" } 
});

module.exports = mongoose.model("Order", orderSchema);