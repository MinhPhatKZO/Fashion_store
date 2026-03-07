const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },

    description: { type: String, required: true, maxlength: 2000 },

    price: { type: Number, required: true, min: 0 },

    originalPrice: { type: Number, min: 0 },

    images: { type: mongoose.Schema.Types.Mixed, default: [] },

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    // 🔴 SỬA TẠI ĐÂY: Đổi brandId -> brand (để khớp với code reviews.js)
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },

    // ✅ Seller giữ nguyên
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sku: { type: String, unique: true, sparse: true },

    tags: [String],

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    
    // Thêm ratings để hỗ trợ tính điểm trung bình sau này (Optional)
    ratings: { type: Number, default: 0 },
    numOfReviews: { type: Number, default: 0 },

    // hàng chờ duyệt/đã lên sàn.
    isApproved: { type: Boolean, default: false }, // Mặc định chưa duyệt
    reasonRejected: { type: String }, // Lý do từ chối (nếu có)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);