const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User"); // Thêm User model để populate email
const { auth } = require("../middleware/auth");
//  Import hàm gửi email
const { sendOrderEmail } = require("../utils/emailService");

// Hàm lấy userId an toàn
const getUserId = (req) => req.user?._id || req.user?.id || req.userId;

/* =======================================================
   HELPER: Tạo mã đơn hàng (ORD00001)
======================================================= */
async function generateOrderNumber() {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  if (!lastOrder) return "ORD00001";
  
  const lastNum = parseInt(lastOrder.orderNumber.replace("ORD", ""), 10);
  if (isNaN(lastNum)) return `ORD${Date.now()}`;

  const nextNum = lastNum + 1;
  return "ORD" + nextNum.toString().padStart(5, "0");
}

/* =======================================================
   HELPER: Logic chung để tạo đơn hàng
======================================================= */
async function createOrderInDB(req, paymentMethod, status) {
    const { items, shippingAddress, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Danh sách sản phẩm không hợp lệ");
    }

    let totalPrice = 0;
    const orderItems = [];
    let seller = null;

    // Duyệt qua từng sản phẩm để tính tiền và kiểm tra seller
    for (const item of items) {
        // Hỗ trợ cả item.product (Frontend gửi) hoặc item.productId
        const productId = item.product || item.productId;
        const product = await Product.findById(productId);

        if (!product) throw new Error(`Sản phẩm ID ${productId} không tồn tại`);

        // Logic: Bắt buộc 1 đơn hàng chỉ thuộc về 1 Seller
        if (!seller) seller = product.seller;
        else if (seller.toString() !== product.seller.toString()) {
            throw new Error("Tất cả sản phẩm trong đơn hàng phải thuộc cùng 1 người bán");
        }

        const itemTotal = product.price * item.quantity;
        totalPrice += itemTotal;

        orderItems.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price,
        });
    }

    const orderNumber = await generateOrderNumber();

    const order = new Order({
        user: getUserId(req),
        seller,
        items: orderItems,
        shippingAddress: typeof shippingAddress === "object" ? JSON.stringify(shippingAddress) : shippingAddress,
        paymentMethod,
        totalPrice,
        notes,
        orderNumber,
        status: status, // Trạng thái được truyền vào tùy loại thanh toán
        isPaid: false
    });

    await order.save();

    //  SAU KHI LƯU DB THÀNH CÔNG -> GỬI EMAIL XÁC NHẬN
    // Cần lấy lại thông tin user để có email gửi đi
    try {
        const fullOrder = await Order.findById(order._id).populate("user", "email name");
        // Gửi mail (Chạy ngầm, không await để tránh làm chậm response)
        sendOrderEmail(fullOrder, status).catch(err => 
            console.error("Gửi email thất bại:", err.message)
        );
    } catch (emailErr) {
        console.error("Lỗi khi chuẩn bị gửi mail:", emailErr);
    }

    return order;
}

/* =======================================================
   1. TẠO ĐƠN VNPAY
    Chỉ tạo DB status 'Pending_Payment'.
======================================================= */
router.post("/vnpay-order", auth, async (req, res) => {
  try {
    const order = await createOrderInDB(req, "VNPay", "Pending_Payment");
    
    // Trả về order để frontend lấy ID
    res.status(201).json({ success: true, data: order, order }); 
  } catch (error) {
    console.error("Lỗi tạo đơn VNPay:", error.message);
    res.status(400).json({ message: error.message });
  }
});

/* =======================================================
   2. TẠO ĐƠN MOMO
   Chỉ tạo DB status 'Pending_Payment'.
======================================================= */
router.post("/momo-order", auth, async (req, res) => {
  try {
    const order = await createOrderInDB(req, "MoMo", "Pending_Payment");
    
    res.status(201).json({ success: true, data: order, order });
  } catch (error) {
    console.error("Lỗi tạo đơn MoMo:", error.message);
    res.status(400).json({ message: error.message });
  }
});

/* =======================================================
   3. TẠO ĐƠN COD
    Status 'Waiting_Approval' (Chờ duyệt)
======================================================= */
router.post("/cod", auth, async (req, res) => {
  try {
    // Với COD, trạng thái là Waiting_Approval -> Email sẽ gửi "Đặt hàng thành công"
    const order = await createOrderInDB(req, "COD", "Waiting_Approval");

    res.status(201).json({ success: true, data: order, order });
  } catch (error) {
    console.error("Lỗi tạo đơn COD:", error.message);
    res.status(400).json({ message: error.message });
  }
});

// Cập nhật địa chỉ
router.patch("/update-shipping/:id", auth, async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress) return res.status(400).json({ message: "Thiếu địa chỉ" });

    const order = await Order.findOne({ _id: req.params.id, user: getUserId(req) });
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    order.shippingAddress = typeof shippingAddress === 'object' ? JSON.stringify(shippingAddress) : shippingAddress;
    await order.save();

    res.json({ success: true, message: "Cập nhật thành công", order });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Lấy danh sách đơn hàng
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: getUserId(req) };

    if (status) filter.status = status;

    const skip = (page - 1) * Number(limit);
    const orders = await Order.find(filter)
      .populate("items.product", "name images price")
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Lấy chi tiết đơn hàng
router.get("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "ID đơn hàng không hợp lệ" });
    }

    const order = await Order.findOne({ _id: req.params.id, user: getUserId(req) })
      .populate("items.product", "name images price")
      .populate("seller", "name email")
      .populate("user", "name email");

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Hủy đơn hàng (User tự hủy)
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body; // lấy lý do huỷ 
    
  // tìm đơn 
    const order = await Order.findOne({ _id: req.params.id, user: getUserId(req) })
        .populate("user", "email name");

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    
    const allowed = ["pending", "Pending_Payment", "Waiting_Approval"];
    if (!allowed.includes(order.status)) {
      return res.status(400).json({ message: "Không thể huỷ đơn hàng ở trạng thái này" });
    }

    order.status = "Cancelled";
    order.cancelReason = reason || "Người mua hủy";

    await order.save();

    //  Gửi email xác nhận hủy đơn
    sendOrderEmail(order, "Cancelled").catch(err => 
        console.error("Lỗi gửi mail hủy đơn:", err.message)
    );

    res.json({ message: "Huỷ đơn thành công", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;