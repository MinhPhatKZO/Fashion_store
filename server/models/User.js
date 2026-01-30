const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên"], // Thêm message lỗi rõ ràng
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ], // Thêm Regex check email
    },

    // ==========================
    // Password
    // ==========================
    password: {
      type: String,
      select: false,
      default: null,
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"], // Thêm validate độ dài
    },

    // ==========================
    // OAuth IDs
    // ==========================
    googleId: { type: String, default: null },
    facebookId: { type: String, default: null },

    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    avatar: { type: String, default: "" },

    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },

    // ⭐ LIÊN KẾT VỚI BRAND (Dành cho Seller)
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 👇 BỔ SUNG: Dùng cho tính năng QUÊN MẬT KHẨU (Reset Password)
    resetPasswordToken: String,
    resetPasswordExpire: Date,

  },
  {
    timestamps: true,
  }
);

/* ==========================
   Hash password trước khi lưu
========================== */
userSchema.pre("save", async function (next) {
  // Nếu không có password (login google) hoặc password chưa sửa -> bỏ qua
  if (!this.password || !this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ==========================
   Compare password (Login)
========================== */
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false; // Trường hợp login Google mà cố nhập pass
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);