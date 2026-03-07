const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const { auth, adminAuth } = require("../../middleware/auth");

// Helper: Bắn tín hiệu socket để FE cập nhật số đỏ ngay lập tức
const emitAdminUpdate = (req) => {
  const io = req.app.get('socketio');
  if (io) io.emit("update_admin_counts");
};

/* ======================================================
   1. LẤY DANH SÁCH SELLER + THỐNG KÊ DOANH THU
====================================================== */
router.get("/", auth, adminAuth, async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" }).select("-password");
    
    const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
      // Đếm số sản phẩm
      const productCount = await Product.countDocuments({ seller: seller._id });
      
      // Tính doanh thu từ đơn "delivered"
      const orders = await Order.find({ seller: seller._id, status: "delivered" });
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      // Tỷ lệ hoàn đơn
      const totalOrders = await Order.countDocuments({ seller: seller._id });
      const cancelledOrders = await Order.countDocuments({ seller: seller._id, status: "cancelled" });
      const returnRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0;

      return {
        ...seller._doc,
        stats: { productCount, totalRevenue, returnRate, totalOrders }
      };
    }));

    res.json(sellersWithStats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi tải danh sách seller" });
  }
});

/* ======================================================
   2. QUẢN LÝ STRIKES & TRẠNG THÁI HOẠT ĐỘNG
====================================================== */
router.put("/:id/status", auth, adminAuth, async (req, res) => {
  try {
    const { isActive, strikes } = req.body;
    let updateData = {};

    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (strikes !== undefined) {
      updateData.strikes = Math.max(0, strikes);
      // Nếu >= 3 gậy tự khóa, dưới 3 gậy tự mở
      updateData.isActive = updateData.strikes < 3;
    }

    const seller = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true, runValidators: false }
    );

    if (!seller) return res.status(404).json({ message: "Không tìm thấy Seller" });
    
    emitAdminUpdate(req);
    res.json({ message: "Cập nhật thành công", seller });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi cập nhật trạng thái" });
  }
});

/* ======================================================
   3. DUYỆT SẢN PHẨM
====================================================== */
router.get("/products/pending", auth, adminAuth, async (req, res) => {
  try {
    const products = await Product.find({ isApproved: false })
      .populate("seller", "name email taxCode")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải sản phẩm" });
  }
});

router.put("/products/:id/approve", auth, adminAuth, async (req, res) => {
  try {
    const { status, reason } = req.body; 
    const update = status === 'approved' 
      ? { isApproved: true, isActive: true, reasonRejected: "" } 
      : { isApproved: false, isActive: false, reasonRejected: reason };

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    emitAdminUpdate(req);
    res.json({ message: status === 'approved' ? "Đã duyệt sản phẩm" : "Đã từ chối", product });
  } catch (err) {
    res.status(400).json({ message: "Lỗi xử lý duyệt sản phẩm" });
  }
});

/* ======================================================
   4. QUẢN LÝ ĐƠN ĐĂNG KÝ SELLER MỚI (PENDING)
====================================================== */
router.get("/requests/pending", auth, adminAuth, async (req, res) => {
  try {
    // Tìm User role 'user' nhưng có đơn status 'pending'
    const requests = await User.find({ 
      role: "user", 
      "businessLicense.status": "pending" 
    }).select("-password").sort({ updatedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải đơn đăng ký" });
  }
});

router.put("/requests/:id/approve", auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body; 
    
    let updateData = {};
    if (status === "approved") {
      updateData = {
        role: "seller",
        "businessLicense.status": "approved",
        isActive: true
      };
    } else {
      updateData = {
        "businessLicense.status": "rejected",
        taxCode: "",
        "businessLicense.url": "" // Reset để nộp lại
      };
    }

    await User.findByIdAndUpdate(req.params.id, updateData);
    emitAdminUpdate(req);
    res.json({ message: "Xử lý thành công" });
  } catch (err) {
    res.status(400).json({ message: "Lỗi xử lý yêu cầu" });
  }
});

module.exports = router;