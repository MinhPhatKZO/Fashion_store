// product model
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [2000, "Description too long"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },

    // ✅ CHẤP NHẬN CẢ STRING, OBJECT HOẶC ARRAY
    images: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    // 💡 ĐÃ SỬA: Dùng categoryId để khớp dữ liệu
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: false, 
    },

    // 💡 ĐÃ SỬA: Dùng subcategoryId để khớp với Category
    subcategoryId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    // 💡 ĐÃ SỬA: Dùng brandId để khớp dữ liệu
    brandId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Brand", 
      required: false 
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

// ✅ Virtual: ảnh chính (giữ nguyên)
productSchema.virtual("primaryImage").get(function () {
  if (!this.images) return "";

  if (Array.isArray(this.images)) {
    if (this.images.length === 0) return "";
    if (typeof this.images[0] === "string") return this.images[0];
    const primary = this.images.find((img) => img.isPrimary);
    return primary ? primary.url : this.images[0]?.url || "";
  }

  // Trường hợp images không phải mảng
  if (typeof this.images === "string") return this.images;
  if (this.images.url) return this.images.url;
  return "";
});

// ✅ Bảo vệ khi chuyển JSON ra frontend (giữ nguyên)
productSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    // ... (Giữ nguyên logic transform cho images)
    if (ret.images && Array.isArray(ret.images)) {
      ret.images = ret.images.map((img, index) => {
        if (typeof img === "string") {
          return {
            url: img,
            alt: ret.name,
            isPrimary: index === 0,
          };
        }
        return img;
      });
    }
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);