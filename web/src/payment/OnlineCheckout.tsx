import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
        paymentMethod: "momo",
      };

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
    <div className="p-4 max-w-lg mx-auto">
      {/* Title */}
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-3xl font-extrabold mb-6 text-center text-gray-800"
      >
        Chọn phương thức thanh toán
      </motion.h1>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white shadow-xl rounded-xl p-6 border border-gray-100"
      >
        <div className="flex flex-col gap-5">
          {/* VNPay Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVNPay}
            className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold shadow-md"
          >
            <img
              src="hhttps://upload.wikimedia.org/wikipedia/commons/2/23/VNPAY_logo.pnghttps://seeklogo.com/images/V/vnpay-logo-6E8D08A2E7-seeklogo.com.png"
              alt="VNPay"
              className="h-8"
            />
            Thanh toán VNPay
          </motion.button>

          {/* MOMO Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMomo}
            className="flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl text-lg font-semibold shadow-md"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
              alt="MoMo"
              className="h-8 rounded"
            />
            Thanh toán MoMo
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnlineCheckout;
