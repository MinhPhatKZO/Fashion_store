import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface OrderData {
  orderNumber?: string;
  totalAmount?: number;
  paymentMethod?: string;
  status?: string;
}

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    // Kiểm tra dữ liệu từ location.state
    if (location.state && (location.state as any).order) {
      setOrder((location.state as any).order);
    } else {
      // Nếu không có dữ liệu, redirect về trang chủ
      navigate("/", { replace: true });
    }
  }, [location.state, navigate]);

  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold mb-6 text-green-600">🎉 Thanh toán hoàn tất</h2>

      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <div className="flex justify-between">
          <span>Mã đơn hàng:</span>
          <span className="font-semibold">{order.orderNumber || "N/A"}</span>
        </div>

        <div className="flex justify-between">
          <span>Tổng tiền:</span>
          <span className="font-bold text-xl text-red-600">
            {order.totalAmount ? order.totalAmount.toLocaleString("vi-VN") + " ₫" : "N/A"}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Cổng thanh toán:</span>
          <span className="font-bold text-green-600">{order.paymentMethod?.toUpperCase() || "N/A"}</span>
        </div>

        <div className="flex justify-between">
          <span>Trạng thái:</span>
          <span className={`font-bold ${order.status === "success" ? "text-green-600" : "text-red-600"}`}>
            {order.status === "success" ? "Thành công ✅" : "Thất bại ❌"}
          </span>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
