const mongoose = require("mongoose");

// 👉 Thay URI nếu bạn dùng database khác
const MONGO_URI = "mongodb://localhost:27017/fasion_store";

// 👉 Schema Order theo đúng mẫu bạn gửi
const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  user: mongoose.Schema.Types.ObjectId,
  items: [
    {
      product: mongoose.Schema.Types.ObjectId,
      quantity: Number,
      price: Number,
    },
  ],
  totalPrice: Number,
  status: String,
  paymentMethod: String,
  shippingAddress: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date,
});

const Order = mongoose.model("Order", OrderSchema);

async function seedOrders() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // 👉 cập nhật lại ID theo đúng database của bạn
  const userId = "6920c5c468960047a4c314d6";
  const productA = "6924ad10536932f1d585c9c5";
  const productB = "6920c8dcb9731fe4135f89e5";

  const orders = [
    {
      orderNumber: "ORD2001",
      user: userId,
      items: [
        { product: productA, quantity: 1, price: 30000 },
        { product: productB, quantity: 1, price: 500000 },
      ],
      totalPrice: 530000,
      status: "pending",
      paymentMethod: "COD",
      shippingAddress: "123 Lê Lợi, Q1, TP.HCM",
      notes: "Giao giờ hành chính",
      createdAt: new Date("2025-08-21T10:00:00Z"),
      updatedAt: new Date("2025-08-21T10:00:00Z"),
    },
    {
      orderNumber: "ORD2002",
      user: userId,
      items: [
        { product: productA, quantity: 2, price: 30000 },
        { product: productB, quantity: 3, price: 500000 },
      ],
      totalPrice: 1590000,
      status: "processing",
      paymentMethod: "Credit Card",
      shippingAddress: "89 Trần Hưng Đạo, Hà Nội",
      notes: "Ưu tiên đóng gói kỹ",
      createdAt: new Date("2025-08-21T11:10:00Z"),
      updatedAt: new Date("2025-08-21T11:10:00Z"),
    },
    {
      orderNumber: "ORD2003",
      user: userId,
      items: [
        { product: productA, quantity: 3, price: 30000 },
        { product: productB, quantity: 1, price: 500000 },
      ],
      totalPrice: 590000,
      status: "shipped",
      paymentMethod: "Momo",
      shippingAddress: "55 Nguyễn Huệ, Đà Nẵng",
      notes: "",
      createdAt: new Date("2025-08-21T13:00:00Z"),
      updatedAt: new Date("2025-08-21T13:00:00Z"),
    },
    {
      orderNumber: "ORD2004",
      user: userId,
      items: [
        { product: productA, quantity: 5, price: 30000 },
        { product: productB, quantity: 2, price: 500000 },
      ],
      totalPrice: 1160000,
      status: "delivered",
      paymentMethod: "Bank Transfer",
      shippingAddress: "45 Nguyễn Trãi, Hải Phòng",
      notes: "Khách kiểm hàng trước khi nhận",
      createdAt: new Date("2025-08-21T14:40:00Z"),
      updatedAt: new Date("2025-08-21T14:40:00Z"),
    },
    {
      orderNumber: "ORD2005",
      user: userId,
      items: [
        { product: productA, quantity: 10, price: 30000 },
        { product: productB, quantity: 4, price: 500000 },
      ],
      totalPrice: 2360000,
      status: "cancelled",
      paymentMethod: "Credit Card",
      shippingAddress: "321 Hai Bà Trưng, Q1, TP.HCM",
      notes: "Khách yêu cầu hủy đơn",
      createdAt: new Date("2025-08-21T15:10:00Z"),
      updatedAt: new Date("2025-08-21T15:10:00Z"),
    },
  ];

  await Order.insertMany(orders);
  console.log("Inserted 5 sample orders!");

  mongoose.connection.close();
}

seedOrders().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});
