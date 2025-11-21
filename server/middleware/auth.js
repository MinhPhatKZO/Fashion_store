// middleware/auth.js (ĐÃ SỬA)
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

    req.user = decoded;
    // ⭐ SỬA LỖI TẠI ĐÂY: Dùng 'id' thay vì 'userId'
    req.userId = decoded.id; // Lấy ID từ trường 'id' trong JWT

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Không đủ quyền truy cập" });
  }
  next();
};

module.exports = { auth, adminAuth };