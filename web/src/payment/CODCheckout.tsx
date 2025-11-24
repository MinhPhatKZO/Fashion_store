import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variantId?: string;
}

const CODCheckout: React.FC = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const shippingFee = 30000;

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (cart.length === 0) {
      alert("Giỏ hàng trống. Vui lòng thêm sản phẩm để thanh toán.");
      navigate("/cart");
    }
  }, [cart, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    const payload = {
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      items: cart.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        quantity: i.quantity,
        price: i.price,
      })),
      shippingAddress: shippingInfo,
      paymentMethod: "COD",
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/orders/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        navigate("/order-confirmation", { state: { order: data.order } });
      } else {
        alert("Đặt hàng thất bại: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold mb-8 text-indigo-600">📦 Xác nhận đơn hàng (COD)</h2>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold mb-4">🏡 Thông tin giao hàng</h3>
            <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleChange} placeholder="Họ và tên" className="w-full p-3 border rounded-lg mb-2"/>
            <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleChange} placeholder="Số điện thoại" className="w-full p-3 border rounded-lg mb-2"/>
            <textarea name="address" value={shippingInfo.address} onChange={handleChange} placeholder="Địa chỉ" rows={3} className="w-full p-3 border rounded-lg"/>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold mb-4">🛒 Sản phẩm ({cart.length})</h3>
            {cart.map((item, idx) => {
              const itemTotal = item.price * item.quantity;
              return (
                <div key={idx} className="flex items-center space-x-4 border-b pb-4 last:border-b-0 last:pb-0 pt-4 first:pt-0">
                  <img src={item.productImage || "/placeholder.png"} alt={item.productName} className="w-16 h-16 rounded-md border object-cover"/>
                  <div className="flex-1">
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.price.toLocaleString("vi-VN")} ₫</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                    <p className="font-bold text-red-600">{itemTotal.toLocaleString("vi-VN")} ₫</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">💵 Thanh toán</h3>
          <div className="flex justify-between mb-2"><span>Tạm tính:</span><span>{totalAmount.toLocaleString("vi-VN")} ₫</span></div>
          <div className="flex justify-between mb-2"><span>Phí ship:</span><span>{shippingFee.toLocaleString("vi-VN")} ₫</span></div>
          <div className="flex justify-between border-t pt-4"><span className="font-bold text-xl">Tổng cộng:</span><span className="text-2xl font-bold text-red-600">{(totalAmount + shippingFee).toLocaleString("vi-VN")} ₫</span></div>

          <button onClick={handlePlaceOrder} className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Đặt hàng</button>
        </div>
      </div>
    </div>
  );
};

export default CODCheckout;
