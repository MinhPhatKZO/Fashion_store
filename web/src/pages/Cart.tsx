import React, { useEffect } from "react";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeItem, addItems } = useCart();
  const navigate = useNavigate();

  // --- Load “repayCart” nếu có ---
  useEffect(() => {
    const repayCartJSON = localStorage.getItem("repayCart");
    if (repayCartJSON) {
      try {
        const repayItems = JSON.parse(repayCartJSON);
        if (Array.isArray(repayItems) && repayItems.length > 0) {
          addItems(repayItems); // Thêm vào context cart
        }
      } catch (err) {
        console.error("Lỗi khi đọc repayCart:", err);
      } finally {
        localStorage.removeItem("repayCart"); // Xóa key sau khi nạp
      }
    }
  }, [addItems]);

  // Tổng tiền
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Tổng số sản phẩm
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Xử lý chuyển hướng thanh toán
  const handleCheckoutNavigation = (method: "cod" | "online") => {
    if (cart.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    const orderDataToSend = {
      items: cart,
      totalPrice: total,
    };

    if (method === "cod") {
      navigate("/checkout/cod", { state: { orderData: orderDataToSend } });
    } else {
      navigate("/checkout/online", { state: { orderData: orderDataToSend } });
    }
  };

  return (
    <motion.div className="max-w-7xl mx-auto mt-10 px-4">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-2">
        🛒 Giỏ hàng của bạn
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Danh sách sản phẩm */}
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

        {/* Tổng tiền + nút */}
        <div className="bg-gray-50 rounded-2xl shadow-md p-6 flex flex-col justify-between">
          <div className="mb-6">
            <p className="text-gray-500 font-medium">
              Tổng số sản phẩm: {totalItems}
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              Tổng tiền: {total.toLocaleString("vi-VN")} ₫
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Chọn hình thức thanh toán
            </h3>

            <button
              onClick={() => handleCheckoutNavigation("cod")}
              disabled={cart.length === 0}
              className={`w-full py-3 text-lg font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-2xl
                ${
                  cart.length === 0
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 text-white shadow-indigo-400/50 hover:bg-indigo-700"
                }`}
            >
              💵 Thanh toán khi nhận hàng (COD)
            </button>

            <button
              onClick={() => handleCheckoutNavigation("online")}
              disabled={cart.length === 0}
              className={`w-full py-3 text-lg font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-2xl
                ${
                  cart.length === 0
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-green-600 text-white shadow-green-400/50 hover:bg-green-700"
                }`}
            >
              💳 Thanh toán Online
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
