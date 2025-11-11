import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface CartSummaryProps {
  total: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({ total }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-6 sticky top-10"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Tổng kết đơn hàng
      </h2>

      <div className="flex justify-between mb-2">
        <span className="text-gray-600">Tổng tiền:</span>
        <span className="text-lg font-bold text-blue-600">
          {total.toLocaleString()} ₫
        </span>
      </div>

      <div className="mt-6 flex flex-col space-y-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => alert("Chức năng thanh toán sắp ra mắt 😎")}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Thanh toán
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/products")}
          className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          Tiếp tục mua sắm
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CartSummary;
