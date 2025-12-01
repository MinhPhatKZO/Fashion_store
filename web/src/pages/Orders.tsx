import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Hàm lấy ảnh an toàn
  const getImageUrl = (item: OrderItem) => {
    if (!item.product.images || item.product.images.length === 0)
      return "https://via.placeholder.com/80x80?text=No+Image";

    const first = item.product.images[0];

    if (typeof first === "string") return first.startsWith("http") ? first : `http://localhost:5000/${first}`;

    if (typeof first === "object" && "url" in first && typeof first.url === "string") {
      const primaryImage = item.product.images.find(
        (img): img is { url: string; isPrimary?: boolean } =>
          typeof img === "object" && "url" in img && !!img.isPrimary
      );
      return primaryImage ? primaryImage.url : first.url;
    }

    return "https://via.placeholder.com/80x80?text=No+Image";
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "https://via.placeholder.com/80x80?text=Image+Not+Found";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách đơn hàng</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
            className="p-4 border rounded-lg shadow-sm bg-white cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Mã đơn: {order.orderNumber}</span>
              <span className={`px-2 py-1 rounded text-sm ${getStatusClasses(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p>
              <strong>Tổng tiền:</strong> {(order.totalPrice || 0).toLocaleString("vi-VN")} ₫
            </p>
            <p>
              <strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
            <p>
              <strong>Người bán:</strong> {order.seller?.name || "N/A"}
            </p>
            <div className="mt-2">
              <strong>Sản phẩm:</strong>
              <ul className="list-disc ml-5">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <img
                      src={getImageUrl(item)}
                      alt={item.product.name}
                      className="w-10 h-10 object-cover rounded"
                      onError={handleImageError}
                    />
                    <span>
                      {item.product.name} x {item.quantity} -{" "}
                      {(item.price || 0).toLocaleString("vi-VN")} ₫
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
