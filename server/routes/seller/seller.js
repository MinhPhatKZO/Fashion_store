const express = require("express");
const router = express.Router();
// 1. Import sellerBrandAuth để tự động lấy Brand của seller
const { auth, sellerBrandAuth } = require("../../middleware/auth");

const Order = require("../../models/Order");
const Product = require("../../models/Product");

// ===============================
//      API SELLER DASHBOARD
// ===============================
router.get("/dashboard", auth, sellerBrandAuth, async (req, res) => {
  try {
    // req.sellerBrandId và req.user.id có sẵn từ middleware
    const sellerId = req.user.id; 
    const brandId = req.sellerBrandId;

    // ===============================
    // 1. Lấy danh sách sản phẩm theo BRAND (Logic mới)
    // ===============================
    // Thay vì tìm theo userId, ta tìm theo brandId để đảm bảo chính xác
    const products = await Product.find({ brandId: brandId })
      .select("name price stock sold views image") // Lấy thêm sold/views để hiển thị thống kê nếu cần
      .sort({ createdAt: -1 });

    // ===============================
    // 2. Lấy đơn hàng của Seller
    // ===============================
    // Giả định Model Order có trường 'seller' lưu UserID của người bán
    // Hoặc nếu bạn lưu theo brand thì đổi thành { brandId: brandId }
    const orders = await Order.find({ seller: sellerId })
      .populate("user", "name email") // Lấy thêm info người mua nếu cần
      .sort({ createdAt: -1 });

    // ===============================
    // 3. Tính toán thống kê (Logic giữ nguyên)
    // ===============================
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Chủ nhật = 0

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;
    let totalRevenue = 0; // Thêm tổng doanh thu toàn thời gian

    // Mảng doanh thu biểu đồ
    let weekRevenue = Array(7).fill(0); // CN -> T7
    let monthRevenue = Array(12).fill(0); // T1 -> T12

    orders.forEach((order) => {
      // Chỉ tính đơn hàng đã thanh toán hoặc hoàn thành (Tùy logic của bạn)
      // Ví dụ: if (order.status === 'Cancelled') return;

      const created = new Date(order.createdAt);
      const price = order.totalPrice || 0;

      totalRevenue += price;

      // Doanh thu hôm nay
      if (created >= startOfDay) revenueToday += price;

      // Doanh thu tuần này
      if (created >= startOfWeek) {
        revenueWeek += price;
        weekRevenue[created.getDay()] += price;
      }

      // Doanh thu tháng này
      if (created >= startOfMonth) revenueMonth += price;

      // Doanh thu từng tháng trong năm nay
      if (created.getFullYear() === now.getFullYear()) {
        monthRevenue[created.getMonth()] += price;
      }
    });

    return res.status(200).json({
      brandInfo: {
        id: req.sellerBrand._id,
        name: req.sellerBrand.name,
        logo: req.sellerBrand.logoUrl
      },
      stats: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue
      },
      products, // Danh sách sản phẩm (để hiển thị bảng quản lý nhanh)
      orders,   // Danh sách đơn hàng mới nhất
      revenue: {
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth,
        chartWeek: weekRevenue,
        chartMonth: monthRevenue,
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({ message: "Lỗi Server khi tải Dashboard", error: error.message });
  }
});

module.exports = router;