const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Loại tương tác: 'view' (xem), 'cart' (thêm giỏ hàng), 'buy' (mua)
    action: {
        type: String,
        enum: ['view', 'cart', 'buy'],
        default: 'view'
    },
    // Điểm số tương tác (Để AI biết hành động nào quan trọng hơn)
    // Ví dụ: Xem = 1 điểm, Thêm giỏ = 3 điểm, Mua = 5 điểm
    score: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

// Tránh việc ghi trùng lặp quá nhiều cùng 1 hành động của 1 user trên 1 sản phẩm trong thời gian ngắn
interactionSchema.index({ userId: 1, productId: 1, action: 1 });

module.exports = mongoose.model('Interaction', interactionSchema);