const jwt = require("jsonwebtoken");
const Brand = require("../models/Brands"); // ✅ Cần import Model Brand để kiểm tra

/* ==========================
   1. AUTH MIDDLEWARE (Kiểm tra đăng nhập)
========================== */
const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token, vui lòng đăng nhập" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );

    // decoded = { id, role, ... }
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    req.user = decoded; // Lưu toàn bộ info user
    req.userId = decoded.id; // Lưu riêng ID cho tiện

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
};

/* ==========================
   2. ADMIN AUTH (Chỉ cho phép Admin)
========================== */
const adminAuth = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "Không xác định quyền người dùng" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền Admin" });
  }

  next();
};

/* ==========================
   3. SELLER AUTH (Chỉ kiểm tra Role là Seller)
========================== */
const sellerAuth = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "Không xác định quyền người dùng" });
  }

  if (req.user.role !== "seller") {
    return res.status(403).json({ message: "Chỉ tài khoản Seller mới được truy cập" });
  }

  next();
};

/* ==========================
   4. SELLER BRAND AUTH (Quan trọng nhất)
   - Kiểm tra role Seller
   - Tự động tìm Brand thuộc về Seller này
   - Gán req.sellerBrandId để dùng ở Controller
========================== */
const sellerBrandAuth = async (req, res, next) => {
  try {
    // 1. Check role trước
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Chỉ Seller mới được thực hiện thao tác này" });
    }

    // 2. Tìm Brand mà seller này sở hữu (1 Seller - 1 Brand)
    const brand = await Brand.findOne({ sellerId: req.user.id });

    if (!brand) {
      return res.status(404).json({ 
        message: "Tài khoản Seller này chưa được liên kết với Brand nào. Vui lòng liên hệ Admin." 
      });
    }

    // 3. Gán thông tin vào Request để dùng ở bước sau
    req.sellerBrand = brand;        // Lấy cả object brand
    req.sellerBrandId = brand._id;  // Lấy riêng ID cho tiện query sản phẩm

    next();
  } catch (err) {
    console.error("Seller Brand Auth Error:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi xác thực Brand" });
  }
};

module.exports = { auth, adminAuth, sellerAuth, sellerBrandAuth };