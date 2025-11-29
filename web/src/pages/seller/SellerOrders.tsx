import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const token = localStorage.getItem("token");

type OrderItem = {
  product: { name: string; price: number; images?: { url: string }[] };
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  user?: { name?: string; email?: string };
  items: OrderItem[];
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const SellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setOrders(res.data.orders ?? res.data);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý đơn hàng</h1>

      {loading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500 text-center py-10">Không có đơn hàng</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((o) => (
            <div
              key={o._id}
              className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                {/* Left: Thông tin đơn */}
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Mã đơn: <span className="font-semibold">{o._id}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    Ngày tạo:{" "}
                    <span className="font-medium">
                      {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {o.user?.name && (
                    <div className="text-sm text-gray-500">
                      Người mua: <span className="font-medium">{o.user.name}</span>
                    </div>
                  )}
                </div>

                {/* Right: Trạng thái + tổng tiền */}
                <div className="text-right">
                  <div className="text-lg font-bold mb-1">
                    {o.totalPrice?.toLocaleString() ?? 0} đ
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${statusColors[o.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    {o.status}
                  </span>
                </div>
              </div>

              {/* Items list */}
              <div className="mt-3 border-t pt-2">
                {o.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString()} đ</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
