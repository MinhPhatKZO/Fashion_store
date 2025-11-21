import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

type OnlineMethod = "momo" | "vnpay" | null;

interface OrderData {
  orderNumber: string;
  totalAmount: number;
  items: any[];
  shippingAddress?: any;
}

const OnlineCheckout: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<OnlineMethod>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();

  // Tổng tiền và tạo orderData
  const totalAmount = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const shippingFee = 30000;
  const finalAmount = totalAmount + shippingFee;

  const orderData: OrderData = location.state?.orderData || {
    orderNumber: `ORD-${Date.now()}`,
    totalAmount,
    items: cart,
    shippingAddress: null,
  };

  const handleProceed = async () => {
    if (!selectedMethod) {
      alert("Vui lòng chọn một cổng thanh toán.");
      return;
    }

    try {
      let response;
      if (selectedMethod === "momo") {
        response = await fetch("http://localhost:5000/api/momo/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalAmount,
            orderInfo: `Thanh toán đơn ${orderData.orderNumber}`,
          }),
        });
      } else if (selectedMethod === "vnpay") {
        response = await fetch("http://localhost:5000/api/vnpay/create_payment_url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalAmount,
          }),
        });
      }

      const data = await response?.json();

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        console.error(data);
        alert("Không thể tạo giao dịch, thử lại sau!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold mb-6 text-green-600">Thanh Toán Online</h2>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <p className="text-lg mb-4 font-semibold">Vui lòng chọn cổng thanh toán:</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {["momo", "vnpay"].map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method as OnlineMethod)}
              className={`py-4 text-md font-bold rounded-xl transition-all shadow-md transform hover:scale-[1.05] ${
                selectedMethod === method
                  ? "bg-green-600 text-white shadow-green-400/50"
                  : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-green-50"
              }`}
            >
              {method.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span>Mã đơn hàng:</span>
            <span className="font-semibold">{orderData.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Tạm tính:</span>
            <span>{totalAmount.toLocaleString("vi-VN")} ₫</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Phí vận chuyển:</span>
            <span>{shippingFee.toLocaleString("vi-VN")} ₫</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Tổng cộng:</span>
            <span className="font-bold text-xl text-red-600">{finalAmount.toLocaleString("vi-VN")} ₫</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Cổng thanh toán:</span>
            <span className="font-bold text-green-600">{selectedMethod?.toUpperCase() || "Chưa chọn"}</span>
          </div>
        </div>

        <button
          onClick={handleProceed}
          disabled={!selectedMethod}
          className={`mt-6 w-full py-3 text-white font-bold rounded-lg transition ${
            selectedMethod ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Tiếp tục thanh toán
        </button>
      </div>
    </div>
  );
};

export default OnlineCheckout;
