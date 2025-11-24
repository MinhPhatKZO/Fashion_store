const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Không có token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "default_secret"
    );

    req.user = decoded;
    req.userId = decoded.id;

    next();

  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Không đủ quyền admin" });
  next();
};

const sellerAuth = (req, res, next) => {
  if (req.user.role !== "seller")
    return res.status(403).json({ message: "Chỉ seller mới được truy cập" });
  next();
};

module.exports = { auth, adminAuth, sellerAuth };
