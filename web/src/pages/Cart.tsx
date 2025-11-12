import React from "react";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeItem } = useCart();

  // 🔹 Tổng tiền
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 🔹 Tổng số sản phẩm
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div className="max-w-7xl mx-auto mt-10 px-4">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-2">🛒 Giỏ hàng của bạn</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bên trái: danh sách sản phẩm */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <AnimatePresence>
            {cart.length > 0 ? (
              cart.map(item => (
                <CartItem
                  key={item.productId}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            ) : (
              <motion.p
                className="text-gray-400 text-center py-16 text-lg italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Giỏ hàng trống, hãy thêm sản phẩm 😄
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Bên phải: tổng tiền + nút */}
        <div className="bg-gray-50 rounded-2xl shadow-md p-6 flex flex-col justify-between">
          <div className="mb-6">
            <p className="text-gray-500 font-medium">Tổng số sản phẩm: {totalItems}</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              Tổng tiền: {total.toLocaleString()} ₫
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              onClick={() => alert("Chức năng thanh toán chưa được tích hợp 😅")}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-bold text-lg rounded-xl shadow-lg hover:from-blue-600 hover:to-teal-500 transition-all transform hover:-translate-y-1 hover:shadow-2xl"
            >
              Thanh toán
            </button>


            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-4 bg-gray-100 border-2 border-blue-500 text-blue-600 font-semibold text-lg rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              Tiếp tục mua sắm
            </button>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Cart;
