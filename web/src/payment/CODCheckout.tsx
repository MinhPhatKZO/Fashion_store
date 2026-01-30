import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/features/cart/CartContext";
import { User, Phone, MapPin, Package, ChevronLeft, Truck, CheckCircle, ShoppingBag } from "lucide-react";

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

  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => window.history.back()} 
          className="p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter">
          Thanh toán <span className="text-stone-400 font-light ml-2 text-2xl">(COD)</span>
        </h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        
        {/* --- LEFT COLUMN: THÔNG TIN & SẢN PHẨM --- */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* 1. Thông tin giao hàng (Đã chỉnh sửa đẹp mắt hơn) */}
          <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-stone-900"></div> {/* Dải màu điểm nhấn */}
            <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-stone-900" />
              </div>
              Thông tin giao nhận
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ và tên */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 mb-2">Họ và tên *</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleChange}
                      className="pl-12 block w-full py-3 border-stone-300 rounded-xl shadow-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all bg-stone-50 focus:bg-white"
                      placeholder="Ví dụ: Nguyễn Văn A"
                    />
                  </div>
                </div>
                {/* Số điện thoại */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">Số điện thoại *</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleChange}
                      className="pl-12 block w-full py-3 border-stone-300 rounded-xl shadow-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all bg-stone-50 focus:bg-white"
                      placeholder="Ví dụ: 0901234567"
                    />
                  </div>
                </div>
              </div>
              
              {/* Địa chỉ */}
              <div>
                 <label htmlFor="address" className="block text-sm font-medium text-stone-700 mb-2">Địa chỉ nhận hàng *</label>
                <div className="relative group">
                   <div className="absolute top-3 left-4 pointer-events-none">
                      <MapPin className="h-5 w-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                    </div>
                  <textarea
                    id="address"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleChange}
                    rows={3}
                    className="pl-12 block w-full py-3 border-stone-300 rounded-xl shadow-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all bg-stone-50 focus:bg-white resize-none"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Sản phẩm trong đơn (Đã chỉnh sửa rõ nét hơn) */}
          <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
             <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-stone-900" />
              </div>
              Danh sách sản phẩm ({cart.length})
            </h3>
            <div className="divide-y divide-stone-100">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-6 py-4 first:pt-0 last:pb-0">
                  {/* Ảnh sản phẩm nổi bật hơn */}
                  <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-stone-200 p-1 shadow-sm">
                    <img 
                      src={item.productImage || "/placeholder.png"} 
                      alt={item.productName} 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  {/* Thông tin chi tiết */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-stone-900 truncate mb-1">{item.productName}</p>
                    <div className="flex items-center text-sm text-stone-500 gap-4">
                      <p className="bg-stone-100 px-2 py-0.5 rounded-md font-medium">SL: {item.quantity}</p>
                      {item.variantId && <p>Phân loại: {item.variantId}</p>}
                    </div>
                  </div>
                  {/* Giá tiền rõ ràng */}
                  <div className="text-right">
                    <p className="font-bold text-lg text-stone-900">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                    </p>
                    <p className="text-xs text-stone-400">{item.price.toLocaleString("vi-VN")} ₫/sp</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* --- RIGHT COLUMN: ORDER SUMMARY (Giữ nguyên style cũ cho đồng bộ) --- */}
        <div className="lg:col-span-5">
          <div className="bg-stone-50 p-8 rounded-2xl border border-stone-200 sticky top-28 shadow-lg shadow-stone-100/50">
            <h3 className="text-lg font-bold text-stone-900 uppercase tracking-wide mb-6 pb-4 border-b border-stone-200 flex items-center gap-2">
              <Package className="w-5 h-5" /> Tóm tắt đơn hàng
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-stone-600 text-base">
                <span>Tạm tính</span>
                <span className="font-medium">{totalAmount.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between text-stone-600 text-base">
                <span className="flex items-center gap-2"><Truck className="w-5 h-5 text-stone-500"/> Phí vận chuyển (COD)</span>
                <span className="font-medium">{shippingFee.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-stone-200 mt-6">
                <span className="text-xl font-bold text-stone-900">Tổng thanh toán</span>
                <div className="text-right">
                  <span className="text-3xl font-black text-stone-900 block">
                    {(totalAmount + shippingFee).toLocaleString("vi-VN")} ₫
                  </span>
                  <span className="text-sm text-stone-500 font-medium">(Đã bao gồm VAT)</span>
                </div>
              </div>
            </div>

            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-4 items-start">
               <CheckCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold text-amber-800 mb-1">Thanh toán khi nhận hàng</p>
                 <p className="text-sm text-amber-700 leading-relaxed">
                   Bạn chỉ phải thanh toán cho shipper sau khi đã nhận và kiểm tra hàng hóa.
                 </p>
               </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isLoading}
              className={`w-full py-5 px-6 text-base font-bold uppercase tracking-wider rounded-xl transition-all shadow-md
                ${isLoading 
                  ? "bg-stone-400 cursor-wait" 
                  : "bg-stone-900 text-white hover:bg-black hover:shadow-xl active:transform active:scale-[0.99]"
                }`}
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
            </button>
            
            <p className="text-center mt-6 text-xs text-stone-500 font-medium">
              Bằng việc xác nhận, bạn đồng ý với <a href="#" className="underline hover:text-stone-900">Điều khoản dịch vụ</a> và <a href="#" className="underline hover:text-stone-900">Chính sách bảo mật</a> của chúng tôi.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CODCheckout;