import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface OrderData {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  items: any[];
  shippingAddress?: string;
}

const MomoCheckout: React.FC = () => {
  const location = useLocation(); // lấy URL hiện tại 
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const query = new URLSearchParams(location.search);
  const orderId = query.get("orderId"); // chỉ cần lấy từ query

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // === Lấy thông tin đơn hàng mới tạo ===
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/orders/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setOrderData(data.order);
        } else {
          alert("Không tìm thấy đơn hàng MoMo mới tạo");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi lấy đơn hàng MoMo");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700">
        Đang tải đơn hàng...
      </div>
    );
  if (!orderData)
    return (
      <div className="p-6 text-red-500 text-center">
        Không tìm thấy đơn hàng
      </div>
    );

  const handleSubmit = async () => {
    if (!token) {
      alert("Bạn cần đăng nhập để thanh toán!");
      navigate("/login");
      return;
    }

    try {
      // cập nhật shippingAddress 
      if (fullname || phone || address) {
        const updateRes = await fetch(
          `http://localhost:5000/api/orders/update-shipping/${orderData._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              shippingAddress: `Người nhận: ${fullname}, ĐT: ${phone}, Địa chỉ: ${address}`,
            }),
          }
        );
        const updateData = await updateRes.json();
        if (!updateData.success) {
          alert("Không thể cập nhật địa chỉ giao hàng");
          return;
        }
      }

      // === Tạo URL thanh toán MoMo ===
      const payRes = await fetch("http://localhost:5000/api/momo/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: orderData.totalPrice,
          orderInfo: `Thanh toán đơn hàng ${orderData.orderNumber}`, // Bắt buộc
        }),
      });

      const payData = await payRes.json();
      console.log(" MoMo response:", payData);

      if (payData.payUrl) {
        window.location.href = payData.payUrl;
      } else {
        alert(
          `Không tạo được URL thanh toán MoMo. Chi tiết: ${payData.message || ""}`
        );
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi server khi tạo URL MoMo!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-pink-600 mb-4">Thanh toán MoMo</h2>

      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <p>
          <strong>Mã đơn hàng:</strong> {orderData.orderNumber}
        </p>
        <p>
          <strong>Tổng tiền:</strong>{" "}
          {orderData.totalPrice.toLocaleString("vi-VN")} ₫
        </p>

        <h3 className="text-xl font-semibold mt-4">
          Thông tin giao hàng (tùy chọn)
        </h3>

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
          className="mt-4 w-full py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700"
        >
          Tiếp tục thanh toán qua MoMo
        </button>
      </div>
    </div>
  );
};

export default MomoCheckout;
