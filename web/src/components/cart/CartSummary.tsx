// components/CartSummary.tsx
// (Tạo mới hoặc sửa đổi nếu file này đã tồn tại)

import React from 'react';
import { motion } from 'framer-motion';

interface CartSummaryProps {
  total: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({ total }) => {
  const shippingCost = total > 0 && total < 500000 ? 30000 : 0; // Ví dụ: miễn phí ship trên 500k
  const finalTotal = total + shippingCost;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl p-8 sticky top-20 border border-gray-100" // sticky top-20 để nó dính khi scroll
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">
        Tổng kết đơn hàng
      </h2>

      <div className="flex justify-between items-center text-lg text-gray-700 mb-3">
        <span>Tổng cộng:</span>
        <span className="font-semibold">{total.toLocaleString("vi-VN")} ₫</span>
      </div>

      <div className="flex justify-between items-center text-lg text-gray-700 mb-6 border-b pb-4">
        <span>Phí vận chuyển:</span>
        <span className="font-semibold">
          {shippingCost > 0 ? shippingCost.toLocaleString("vi-VN") + " ₫" : "Miễn phí"}
        </span>
      </div>

      <div className="flex justify-between items-center text-2xl font-extrabold text-indigo-700 mb-8">
        <span>Thành tiền:</span>
        <span>{finalTotal.toLocaleString("vi-VN")} ₫</span>
      </div>

      <button className="w-full bg-indigo-600 text-white py-4 rounded-full text-xl font-bold hover:bg-indigo-700 transition duration-300 transform hover:scale-105 shadow-lg">
        Tiến hành thanh toán
      </button>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Bạn có mã giảm giá? Nhập ở bước thanh toán.
      </p>
    </motion.div>
  );
};

export default CartSummary;