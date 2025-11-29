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

    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },

    // ✅ Sửa đúng: mỗi sản phẩm thuộc về một người bán (seller)
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
  },
  { timestamps: true }
);
module.exports = mongoose.model("Product", productSchema);