// src/payment/VNPayCheckout.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface OrderData {
  orderNumber?: string;
  totalAmount: number;
  items: any[];
  seller: string;
}

const VNPayCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const orderData: OrderData = location.state?.orderData || null;

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  if (!orderData)
    return <div className="p-6 text-red-500">Không tìm thấy đơn hàng</div>;

  const handleSubmit = async () => {
    if (!fullname || !phone || !address) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      // 1️⃣ Tạo đơn hàng trước (status = pending)
      const orderRes = await fetch("http://localhost:5000/api/orders/create-vnpay-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          items: orderData.items,
          seller: orderData.seller,
          totalPrice: orderData.totalAmount,
          shippingAddress: `Người nhận: ${fullname}, ĐT: ${phone}, Địa chỉ: ${address}`,
        }),
      });

      const order = await orderRes.json();
      if (!order.success) {
        alert("Không tạo được đơn hàng");
        return;
      }

      // 2️⃣ Tạo URL thanh toán VNPay
      const payRes = await fetch("http://localhost:5000/api/vnpay/create_payment_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderData.totalAmount,
          orderId: order.orderId,
        }),
      });

      const vnPay = await payRes.json();

      if (vnPay.paymentUrl) {
        window.location.href = vnPay.paymentUrl;
      } else {
        alert("Không tạo được URL thanh toán VNPay");
      }

    } catch (err) {
      console.error(err);
      alert("Lỗi server");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-blue-600 mb-4">Thanh toán VNPay</h2>

      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <p><strong>Tổng tiền:</strong> {orderData.totalAmount.toLocaleString("vi-VN")} ₫</p>

        <h3 className="text-xl font-semibold mt-4">Nhập thông tin giao hàng</h3>

        <input
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Họ và tên"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />

        <input
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <textarea
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Địa chỉ giao hàng"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          className="mt-4 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
        >
          Tiếp tục thanh toán qua VNPay
        </button>
      </div>
    </div>
  );
};

export default VNPayCheckout;
