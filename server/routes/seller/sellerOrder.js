const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
// Import Brand không cần thiết nếu populate từ Product, 
// nhưng giữ lại nếu cần check logic phụ.
const { auth } = require("../../middleware/auth");

/* =======================================================
   HELPER: Tạo mã đơn hàng tự động (VD: ORD00001)
   Lưu ý: Trong môi trường thực tế traffic cao, nên dùng thư viện nano-id hoặc redis
======================================================= */
async function generateOrderNumber() {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  if (!lastOrder) return "ORD00001";
  
  // Tách số, cộng 1 và padding số 0
  const lastNum = parseInt(lastOrder.orderNumber.replace("ORD", ""), 10);
  const nextNum = lastNum + 1;
  return "ORD" + nextNum.toString().padStart(5, "0");
}

/* =======================================================
   1. CREATE ORDER (TÁCH ĐƠN THEO BRAND/SELLER)
   - Input: { items: [{ product, quantity }], ... }
   - Logic: Gom nhóm items theo Brand -> Tạo 1 Order cho mỗi Brand
======================================================= */
router.post("/", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod, shippingAddress, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // 1. Lấy thông tin sản phẩm từ DB (bao gồm info Brand để biết Seller là ai)
    const productIds = items.map(item => item.product);
    
    // Populate 'brandId' để lấy được 'sellerId' bên trong Brand
    const dbProducts = await Product.find({ _id: { $in: productIds } })
      .populate("brandId", "sellerId name") 
      .session(session);

    if (dbProducts.length !== items.length) {
      throw new Error("Một số sản phẩm không tồn tại hoặc đã bị xóa");
    }

    // 2. Gom nhóm sản phẩm theo Brand (Seller)
    // Map cấu trúc: { sellerId: { brandId, sellerId, items: [], totalPrice: 0 } }
    const ordersBySeller = {};

    for (const item of items) {
      const dbProduct = dbProducts.find(p => p._id.toString() === item.product);
      if (!dbProduct) continue;

      // Kiểm tra sản phẩm có thuộc Brand nào không
      if (!dbProduct.brandId) {
        throw new Error(`Sản phẩm "${dbProduct.name}" chưa được liên kết với Brand nào.`);
      }

      // Logic cốt lõi: 1 Brand có 1 Seller. Lấy SellerId từ Brand.
      const sellerId = dbProduct.brandId.sellerId.toString();
      const brandName = dbProduct.brandId.name;

      if (!ordersBySeller[sellerId]) {
        ordersBySeller[sellerId] = {
          sellerId: sellerId,
          items: [],
          totalPrice: 0,
          brandName: brandName // Lưu để debug hoặc log
        };
      }

      // Thêm item vào nhóm của Seller này
      // Lưu ý: Dùng giá từ DB (dbProduct.price) để bảo mật
      ordersBySeller[sellerId].items.push({
        product: dbProduct._id,
        quantity: item.quantity,
        price: dbProduct.price 
      });
      
      ordersBySeller[sellerId].totalPrice += dbProduct.price * item.quantity;
    }

    // 3. Tạo các đơn hàng riêng lẻ
    const createdOrders = [];
    
    for (const sellerId in ordersBySeller) {
      const orderGroup = ordersBySeller[sellerId];
      const orderNumber = await generateOrderNumber(); // Mỗi đơn con có mã riêng

      const newOrder = new Order({
        orderNumber: orderNumber,
        user: req.userId,        // Người mua
        seller: sellerId,        // Người bán (Chủ Brand)
        items: orderGroup.items,
        totalPrice: orderGroup.totalPrice,
        paymentMethod,
        shippingAddress,
        notes,
        status: 'Pending',
        isPaid: false
      });

      await newOrder.save({ session });
      createdOrders.push(newOrder);
    }

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Đặt hàng thành công",
      orders: createdOrders, // Trả về mảng các đơn hàng đã tạo
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("CreateOrder Error:", err);
    res.status(500).json({ message: "Lỗi server khi tạo đơn hàng", error: err.message });
  }
});

/* =======================================================
   2. GET ALL ORDERS (Dành cho Người mua & Admin)
   - Người mua: Xem lịch sử mua hàng của mình
   - Admin: Xem tất cả
======================================================= */
router.get("/", auth, async (req, res) => {
  try {
    const filter = {};

    // Nếu là Admin thì xem hết, nếu là User thường thì chỉ xem đơn của mình
    if (req.user.role !== 'admin') {
       filter.user = req.userId;
    }

    const orders = await Order.find(filter)
      .populate("items.product", "name price images")
      .populate("seller", "name storeName") // Hiển thị tên người bán cho khách thấy
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("GetAllOrders Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   3. GET ORDER BY ID (Bảo mật quyền xem)
======================================================= */
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone address") // Info người mua (cho seller xem)
      .populate("seller", "name") // Info người bán
      .populate("items.product", "name images price");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // BẢO MẬT: Chỉ Người mua, Người bán (của đơn này), hoặc Admin mới được xem
    const isBuyer = order.user._id.toString() === req.userId;
    const isSeller = order.seller && order.seller._id.toString() === req.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
        return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này" });
    }

    res.json(order);
  } catch (err) {
    console.error("GetOrderDetail Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   4. UPDATE STATUS (Chỉ Seller sở hữu đơn hoặc Admin)
   
======================================================= */
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // Kiểm tra quyền: Chỉ Seller của đơn hàng này hoặc Admin mới được update
    const isOwnerSeller = order.seller && order.seller.toString() === req.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnerSeller && !isAdmin) {
        return res.status(403).json({ message: "Bạn không có quyền cập nhật đơn hàng này" });
    }

    order.status = status;
    // Nếu status là Delivered, có thể cập nhật isPaid = true (tùy logic)
    if (status === 'Delivered') {
        order.isPaid = true;
        order.paidAt = Date.now();
    }

    await order.save();

    res.json({ message: "Cập nhật trạng thái thành công", order });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

/* =======================================================
   5. DELETE ORDER (Admin hoặc Khách hủy đơn Pending)
======================================================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    // Admin có quyền xóa tất cả
    if (req.user.role === 'admin') {
        await Order.findByIdAndDelete(req.params.id);
        return res.json({ message: "Admin đã xóa đơn hàng" });
    }

    // Người dùng chỉ được hủy đơn của mình khi còn Pending
    if (order.user.toString() === req.userId) {
        if (order.status !== 'Pending') {
            return res.status(400).json({ message: "Không thể hủy đơn hàng đang giao hoặc đã hoàn thành" });
        }
        await Order.findByIdAndDelete(req.params.id);
        return res.json({ message: "Hủy đơn hàng thành công" });
    }

    return res.status(403).json({ message: "Không có quyền thực hiện" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// =======================================================
// STATS ROUTES (Dành cho Admin/Seller Dashboard)
// =======================================================

// Helper function để lấy filter theo quyền
const getStatsFilter = (req) => {
    // Nếu là seller, chỉ tính đơn của mình
    if (req.user.role === 'seller') return { seller: req.userId };
    // Nếu là admin, tính hết (hoặc tùy logic)
    if (req.user.role === 'admin') return {};
    return { _id: null }; // User thường không xem stats
};

router.get("/stats/today", auth, async (req, res) => {
  try {
    const matchFilter = getStatsFilter(req);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const revenue = await Order.aggregate([
      { $match: { ...matchFilter, createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({ todayRevenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/stats/week", auth, async (req, res) => {
  try {
    const matchFilter = getStatsFilter(req);
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const revenue = await Order.aggregate([
      { $match: { ...matchFilter, createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({ weekRevenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/stats/month", auth, async (req, res) => {
  try {
    const matchFilter = getStatsFilter(req);
    const start = new Date();
    start.setDate(1); // Đầu tháng

    const revenue = await Order.aggregate([
      { $match: { ...matchFilter, createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    res.json({ monthRevenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;