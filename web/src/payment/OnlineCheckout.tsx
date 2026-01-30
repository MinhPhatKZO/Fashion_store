import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, CreditCard, ShieldCheck } from "lucide-react";

const OnlineCheckout: React.FC = () => {
  const storedCart = localStorage.getItem("localCart");
  const cartItems = storedCart ? JSON.parse(storedCart).items : [];

  const navigate = useNavigate();

  // ================== HANDLE VNPAY ==================
  const handleVNPay = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("Bạn chưa đăng nhập");
      if (cartItems.length === 0) return toast.error("Giỏ hàng trống");

      const payloadOrder = {
        items: cartItems.map((item: any) => ({
          product: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: "",
        paymentMethod: "vnpay",
      };

      const res = await axios.post(
        "http://localhost:5000/api/orders/vnpay-order",
        payloadOrder,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/checkout/vnpay?orderId=${res.data.data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi tạo đơn hàng");
    }
  };

  // ================== HANDLE MOMO ==================
  const handleMomo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Bạn chưa đăng nhập");
    if (cartItems.length === 0) return toast.error("Giỏ hàng trống");

    const payloadOrder = {
      items: cartItems.map((item: any) => ({
        product: item.productId,
        quantity: item.quantity,
      })),
      shippingAddress: "",
      paymentMethod: "momo",
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/orders/momo-order",
        payloadOrder,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/checkout/online/momo?orderId=${res.data.data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi tạo đơn hàng");
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-28 pb-16 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => window.history.back()} 
          className="p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter">
          Thanh toán <span className="text-stone-400 font-light ml-2 text-2xl">(ONLINE)</span>
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-stone-200 shadow-xl shadow-stone-100/50 overflow-hidden"
      >
        <div className="p-8 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 text-stone-900" />
            <h3 className="text-xl font-bold text-stone-900 uppercase tracking-wide">
              Chọn cổng thanh toán
            </h3>
          </div>
          <p className="text-stone-500 text-sm pl-9">
            Vui lòng chọn ví điện tử hoặc ứng dụng ngân hàng bạn muốn sử dụng.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* VNPay Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVNPay}
            className="group relative w-full flex items-center justify-between p-5 rounded-xl border border-stone-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-lg shadow-sm border border-stone-100 flex items-center justify-center p-2 group-hover:shadow-md transition-shadow">
                 {/* Link CDN ổn định hơn từ Haitrieu */}
                 <img
                  src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png"
                  alt="VNPay"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-stone-900 group-hover:text-blue-700 transition-colors">Ví VNPAY</p>
                <p className="text-sm text-stone-500">Quét mã QR qua ứng dụng ngân hàng</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-stone-300 group-hover:border-blue-500 group-hover:bg-blue-500 transition-all" />
          </motion.button>

          {/* MOMO Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMomo}
            className="group relative w-full flex items-center justify-between p-5 rounded-xl border border-stone-200 hover:border-pink-500 hover:bg-pink-50/30 transition-all duration-300"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white rounded-lg shadow-sm border border-stone-100 flex items-center justify-center p-1 group-hover:shadow-md transition-shadow">
                {/* Link CDN ổn định hơn từ Haitrieu */}
                <img
                  src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
                  alt="MoMo"
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-stone-900 group-hover:text-pink-700 transition-colors">Ví MoMo</p>
                <p className="text-sm text-stone-500">Thanh toán qua ứng dụng MoMo</p>
              </div>
            </div>
             <div className="w-6 h-6 rounded-full border-2 border-stone-300 group-hover:border-pink-500 group-hover:bg-pink-500 transition-all" />
          </motion.button>
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-200 flex items-center justify-center gap-2 text-stone-500 text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Giao dịch được bảo mật và mã hóa 256-bit SSL</span>
        </div>
      </motion.div>
    </div>
  );
};

export default OnlineCheckout;