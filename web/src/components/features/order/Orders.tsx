import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface OrderItem {
  product: {
    name: string;
    images?: (string | { url: string; isPrimary?: boolean })[];
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  seller: { name: string; email?: string };
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        alert("Bạn cần đăng nhập để xem đơn hàng!");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setOrders(data.orders || []);
        else alert(data.message || "Lỗi khi lấy danh sách đơn hàng");
      } catch (err) {
        console.error(err);
        alert("Lỗi server khi lấy đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700">
        Đang tải danh sách đơn hàng...
      </div>
    );

  if (!orders.length)
    return (
      <div className="p-6 text-center text-gray-600">
        Chưa có đơn hàng nào.
      </div>
    );

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "pending":
      case "unconfirmed":
        return "bg-yellow-400";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const getImageUrl = (item: OrderItem) => {
    if (!item.product.images || item.product.images.length === 0)
      return "https://via.placeholder.com/80?text=No+Image";

    const first = item.product.images[0];

    if (typeof first === "string")
      return first.startsWith("http") ? first : `http://localhost:5000/${first}`;

    if (typeof first === "object" && first.url) {
      const primary = item.product.images.find(
        (img): img is { url: string; isPrimary?: boolean } =>
          typeof img === "object" &&
          img !== null &&
          "url" in img &&
          typeof img.url === "string" &&
          img.isPrimary === true
      );

      return (primary || first).url;
    }

    return "https://via.placeholder.com/80?text=No+Image";
  };

  return (
    <div className="max-w-7xl mx-auto mt-12 px-6 md:px-0">
      <h1 className="text-4xl font-extrabold text-indigo-600 mb-10 text-center">
        Đơn Hàng Của Bạn
      </h1>

      {/* Grid  đơn hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {orders.map((order) => (
          <motion.div
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
            className="relative overflow-hidden p-5 bg-white shadow-lg rounded-2xl border border-gray-200 hover:shadow-2xl transform hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Badge trạng thái */}
            <div
              className={`absolute top-4 right-4 text-white px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                order.status
              )}`}
            >
              {order.status}
            </div>

            {/* Mã đơn */}
            <h3 className="text-xl font-bold text-indigo-600 mb-2">
              Mã đơn: {order.orderNumber}
            </h3>

            {/* Tổng tiền */}
            <div className="text-2xl font-extrabold text-red-500 mb-3">
              {order.totalPrice.toLocaleString("vi-VN")} ₫
            </div>

            {/* Ngày tạo & Người bán */}
            <div className="text-sm text-gray-600 mb-1">
              Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Người bán: {order.seller?.name}
            </div>

            {/* Sản phẩm */}
            <div className="text-sm font-semibold text-gray-700">Sản phẩm:</div>
            <ul className="mt-2 space-y-2 flex-grow">
              {order.items.slice(0, 2).map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <img
                    src={getImageUrl(item)}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <span className="text-sm text-gray-700">
                    {item.product.name} × {item.quantity}
                  </span>
                </li>
              ))}

              {order.items.length > 2 && (
                <p className="text-xs text-gray-500">
                  + {order.items.length - 2} sản phẩm khác...
                </p>
              )}
            </ul>

            {/* Nút xem chi tiết */}
            <button
              onClick={() => navigate(`/orders/${order._id}`)}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Xem chi tiết
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
