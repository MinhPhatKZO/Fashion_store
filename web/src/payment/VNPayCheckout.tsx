import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface OrderData {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  items: any[];
  shippingAddress?: string;
}

const VNPayCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const orderIdFromState = location.state?.orderData?._id;
  const query = new URLSearchParams(location.search);
  const orderIdFromQuery = query.get("orderId");

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // === Fetch order từ backend để đảm bảo tồn tại
  useEffect(() => {
    const orderId = orderIdFromState || orderIdFromQuery;
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrderData(data.order);
        } else {
          alert("Không tìm thấy đơn hàng");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi lấy đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderIdFromState, orderIdFromQuery, token]);

  if (loading) return <div className="p-6">Đang tải đơn hàng...</div>;
  if (!orderData) return <div className="p-6 text-red-500">Không tìm thấy đơn hàng</div>;

  const handleSubmit = async () => {
    if (!fullname || !phone || !address) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (!token) {
      alert("Bạn cần đăng nhập để thanh toán!");
      navigate("/login");
      return;
    }

    try {
      // === Cập nhật shippingAddress
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

      // === Tạo URL thanh toán VNPAY
      const payRes = await fetch("http://localhost:5000/api/vnpay/create_payment_url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: orderData._id, amount: orderData.totalPrice }),
      });
      console.log("Response status:", payRes.status); // Thêm log

      const payData = await payRes.json();
      console.log("Response data:", payData); // Thêm log
      if (payData.paymentUrl) {
        window.location.href = payData.paymentUrl;
      } else {
        alert("Không tạo được URL thanh toán VNPay");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi server!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-blue-600 mb-4">Thanh toán VNPay</h2>
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <p><strong>Tổng tiền:</strong> {orderData.totalPrice.toLocaleString("vi-VN")} ₫</p>

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
