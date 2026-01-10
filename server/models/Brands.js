const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    country: { type: String },
    description: { type: String },
    logoUrl: { type: String },
    
    // --- QUAN TRỌNG: Thêm trường này để liên kết với Seller ---
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",     // Liên kết tới bảng User
      required: true,  // Bắt buộc phải có chủ sở hữu
      unique: true,    // Đảm bảo 1 Seller chỉ sở hữu 1 Brand duy nhất
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);