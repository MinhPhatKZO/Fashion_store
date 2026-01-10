import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext";

interface OrderItem {
  product: {
    _id: string;
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

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const { addToCart } = useCart(); // dùng hook trực tiếp

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) {
        alert("Bạn cần đăng nhập để xem đơn hàng!");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setOrder(data.order || null);
        else alert(data.message || "Lỗi khi lấy đơn hàng");
      } catch (err) {
        console.error(err);
        alert("Lỗi server khi lấy đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700">
        Đang tải chi tiết đơn hàng...
      </div>
    );

  if (!order)
    return (
      <div className="p-6 text-center text-gray-600">
        Không tìm thấy đơn hàng.
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

  const getImageUrl = (item: OrderItem) => {
    if (!item.product.images || item.product.images.length === 0)
      return "https://via.placeholder.com/100x100?text=No+Image";

    const first = item.product.images[0];

    if (typeof first === "string") return first.startsWith("http") ? first : `http://localhost:5000/${first}`;

    if (typeof first === "object" && "url" in first && typeof first.url === "string") {
      const primaryImage = item.product.images.find(
        (img): img is { url: string; isPrimary?: boolean } =>
          typeof img === "object" && "url" in img && !!img.isPrimary
      );
      return primaryImage ? primaryImage.url : first.url;
    }

    return "https://via.placeholder.com/100x100?text=No+Image";
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "https://via.placeholder.com/100x100?text=Image+Not+Found";
  };

  const handleBuyAgain = (item: OrderItem) => {
    addToCart(item.product, item.quantity);
    alert(`${item.product.name} đã được thêm vào giỏ hàng!`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 font-semibold hover:underline"
      >
        ← Quay lại
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Chi tiết đơn hàng {order.orderNumber}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <p>
            <strong>Tổng tiền:</strong> {(order.totalPrice || 0).toLocaleString("vi-VN")} ₫
          </p>
          <p>
            <strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString("vi-VN")}
          </p>
          <p>
            <strong>Người bán:</strong> {order.seller?.name || "N/A"}
          </p>
          <p>
            <strong>Trạng thái:</strong>{" "}
            <span className={`px-2 py-1 rounded text-sm ${getStatusClasses(order.status)}`}>
              {order.status}
            </span>
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-3">Sản phẩm</h2>
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition">
              <img
                src={getImageUrl(item)}
                alt={item.product.name}
                className="w-24 h-24 object-cover rounded"
                onError={handleImageError}
              />
              <div className="flex-1">
                <p className="font-semibold text-lg">{item.product.name}</p>
                <p>
                  Giá: {(item.price || 0).toLocaleString("vi-VN")} ₫ x {item.quantity}
                </p>
                <p className="font-bold mt-1">
                  Tổng: {(item.price * item.quantity || 0).toLocaleString("vi-VN")} ₫
                </p>
              </div>
              <button
                onClick={() => handleBuyAgain(item)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition font-semibold"
              >
                Mua lại
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
