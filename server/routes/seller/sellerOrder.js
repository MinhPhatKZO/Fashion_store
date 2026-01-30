const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const { auth } = require("../../middleware/auth");
// 👇 Import hàm gửi email
const { sendOrderEmail } = require("../../utils/emailService");

/* =======================================================
   1. GET ALL SELLER ORDERS (Lấy danh sách đơn hàng)
======================================================= */
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Quyền truy cập bị từ chối." });
    }

    const filter = { seller: req.userId };

    if (req.query.status && req.query.status !== 'All') {
        filter.status = req.query.status;
    }

    const orders = await Order.find(filter)
      .populate("user", "name email phone address") 
      .populate("items.product", "name images price") 
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Seller GetOrders Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   2. GET ORDER DETAIL (Chi tiết đơn)
======================================================= */
router.get("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "seller") return res.status(403).json({ message: "Access denied" });

    const order = await Order.findOne({
      _id: req.params.id,
      seller: req.userId 
    })
    .populate("user", "name email phone address")
    .populate("items.product", "name images price");

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   3. UPDATE STATUS (Duyệt đơn, Cập nhật & Gửi Email)
======================================================= */
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status, estimatedDeliveryDate, sellerNote } = req.body;
    
    const validStatuses = [
        "Pending_Payment", "Waiting_Approval", "Processing", 
        "Shipped", "Delivered", "Cancelled"
    ];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // 👇 CẦN POPULATE USER ĐỂ LẤY EMAIL GỬI
    const order = await Order.findOne({ _id: req.params.id, seller: req.userId })
        .populate("user", "email name");

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // 1. Cập nhật trạng thái
    order.status = status;

    // 2. Cập nhật thông tin bổ sung (nếu có)
    if (estimatedDeliveryDate) {
        order.estimatedDeliveryDate = estimatedDeliveryDate;
    }
    if (sellerNote) {
        order.sellerNote = sellerNote;
    }

    // 3. Logic tự động khi Giao thành công
    if (status === "Delivered") {
        if (!order.isPaid) {
            order.isPaid = true;
            order.paidAt = new Date();
        }
    }

    // 4. Logic tự động khi Hủy
    if (status === "Cancelled") {
        order.cancelReason = "Người bán hủy đơn";
    }

    await order.save();
    
    // 👇 GỬI EMAIL THÔNG BÁO CHO KHÁCH HÀNG (Chạy bất đồng bộ để không kẹt UI)
    sendOrderEmail(order, status).catch(err => 
        console.error("Gửi email thất bại:", err.message)
    );
    
    res.json({ message: "Cập nhật thành công", order });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   4. STATS (Thống kê Dashboard)
======================================================= */
router.get("/dashboard/stats", auth, async (req, res) => {
    try {
        if (req.user.role !== "seller") return res.status(403).json({ message: "Access denied" });

        const totalOrders = await Order.countDocuments({ seller: req.userId });
        const pendingOrders = await Order.countDocuments({ 
            seller: req.userId, 
            status: "Waiting_Approval" 
        });

        // Doanh thu (Chỉ tính đơn đã thanh toán)
        const revenueData = await Order.aggregate([
            { 
                $match: { 
                    seller: new mongoose.Types.ObjectId(req.userId), 
                    isPaid: true 
                } 
            },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        
        // Doanh thu tuần
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const weekRevenueData = await Order.aggregate([
            {
                $match: {
                    seller: new mongoose.Types.ObjectId(req.userId),
                    isPaid: true,
                    createdAt: { $gte: startOfWeek }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" }, 
                    dailyTotal: { $sum: "$totalPrice" }
                }
            }
        ]);

        let weekRevenue = Array(7).fill(0);
        weekRevenueData.forEach(item => {
            const index = item._id - 1;
            if (index >= 0 && index < 7) weekRevenue[index] = item.dailyTotal;
        });

        res.json({
            totalOrders,
            pendingOrders,
            revenueToday: revenueData[0]?.total || 0, 
            revenueWeek: revenueData[0]?.total || 0,
            revenueMonth: revenueData[0]?.total || 0,
            weekRevenue,
            monthRevenue: Array(12).fill(0)
        });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;