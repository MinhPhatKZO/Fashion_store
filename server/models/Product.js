const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      min: 0,
    },

    images: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    // 🔥 Đây là của bạn muốn thêm
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // mỗi sản phẩm phải thuộc một người bán
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

productSchema.virtual("primaryImage").get(function () {
  if (!this.images) return "";
  if (Array.isArray(this.images)) {
    if (this.images.length === 0) return "";
    if (typeof this.images[0] === "string") return this.images[0];
    const primary = this.images.find((img) => img.isPrimary);
    return primary ? primary.url : this.images[0]?.url || "";
  }
  if (typeof this.images === "string") return this.images;
  if (this.images.url) return this.images.url;
  return "";
});

productSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
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
