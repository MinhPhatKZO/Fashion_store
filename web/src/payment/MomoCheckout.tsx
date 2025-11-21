// src/payment/MomoCheckout.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface OrderData {
  orderNumber: string;
  totalAmount: number;
}

const MomoCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    // Lấy thông tin đơn hàng từ query params
    const params = new URLSearchParams(location.search);
    const orderNumber = params.get("orderId") || params.get("orderNumber") || `ORD-${Date.now()}`;
    const amountStr = params.get("amount") || "0";
    const totalAmount = parseInt(amountStr, 10);

    setOrderData({
      orderNumber,
      totalAmount,
    });
  }, [location.search]);

  const handleGoHome = () => {
    navigate("/");
  };

  if (!orderData) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold text-pink-600 mb-6">Thanh Toán MoMo</h2>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <p className="mb-3">
          <strong>Mã đơn hàng:</strong> {orderData.orderNumber}
        </p>
        <p className="mb-3">
          <strong>Tổng tiền:</strong> {orderData.totalAmount.toLocaleString("vi-VN")} ₫
        </p>

        <p className="mb-4 text-green-600 font-semibold">
          🎉 Thanh toán MoMo thành công!
        </p>

        <button
          onClick={handleGoHome}
          className="mt-4 w-full py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
};

export default MomoCheckout;
