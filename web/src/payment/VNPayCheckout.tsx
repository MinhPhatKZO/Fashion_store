// src/payment/VNPayCheckout.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface OrderData {
  orderNumber?: string;
  totalAmount: number;
}

const VNPayCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const orderData: OrderData = location.state?.orderData;

  if (!orderData) return <div className="p-6 text-red-500">Không tìm thấy đơn hàng</div>;

  const handlePay = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/vnpay/create_payment_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: orderData.totalAmount }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl; // redirect tới VNPay
      } else {
        alert("❌ Lỗi VNPay: " + (data.message || "Không có URL thanh toán"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi server VNPay");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-blue-600 mb-4">Thanh toán VNPay</h2>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <p><strong>Mã đơn hàng:</strong> {orderData.orderNumber}</p>
        <p><strong>Tổng tiền:</strong> {orderData.totalAmount.toLocaleString("vi-VN")} ₫</p>
        <button
          onClick={handlePay}
          className="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
        >
          Thanh toán VNPay
        </button>
      </div>
    </div>
  );
};

export default VNPayCheckout;
