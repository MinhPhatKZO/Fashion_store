import React from "react";
import { useCart } from "../context/CartContext"; 
import CartItem from "../components/CartItem";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ChevronLeft } from 'lucide-react';

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

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
      console.error("Giỏ hàng của bạn đang trống!");
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

  const PRIMARY_COLOR = 'bg-blue-600';
  const PRIMARY_HOVER = 'hover:bg-blue-700';
  const ACCENT_COLOR = 'bg-green-500';

  return (
    <motion.div 
      className="max-w-7xl mx-auto mt-10 px-4 pb-20 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-4xl font-extrabold mb-10 text-gray-900 border-b-2 pb-3 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-blue-600" /> Giỏ hàng của bạn ({totalItems})
      </h2>

      {/* ================== GRID CHÍNH ================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Danh sách sản phẩm - chiếm 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-6 overflow-hidden">
          <AnimatePresence>
            {cart.length > 0 ? (
              cart.map(item => (
                <CartItem
                  key={item.productId + (item.variantId || '')}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            ) : (
              <motion.div
                className="text-center py-24 bg-gray-50 rounded-2xl border-dashed border-2 border-gray-300 m-2 sm:m-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-gray-500 text-xl italic font-medium">
                  Giỏ hàng trống. <span className="font-semibold text-blue-600">Hãy lấp đầy nó nào!</span> 😄
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tóm tắt đơn hàng - chiếm 1/3 */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 h-fit lg:sticky lg:top-10">
          
          <h3 className="text-2xl font-bold text-gray-800 mb-5 border-b pb-3">
            Tóm tắt Đơn hàng
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-lg text-gray-600">
              <span>Tổng số lượng:</span>
              <span className="font-semibold text-gray-800">{totalItems} sản phẩm</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-dashed border-gray-200">
              <span>Thành tiền:</span>
              <span className="text-3xl font-extrabold text-blue-600">
                {total.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-bold text-gray-700 mt-2">
              Chọn phương thức thanh toán
            </h3>
            
            {/* COD */}
            <button
              onClick={() => handleCheckoutNavigation("cod")}
              disabled={cart.length === 0}
              className={`w-full py-3.5 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02]
                ${
                  cart.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                    : `${PRIMARY_COLOR} text-white shadow-blue-400/50 ${PRIMARY_HOVER}`
                }`}
            >
              💵 Thanh toán khi nhận hàng (COD)
            </button>

            {/* Online */}
            <button
              onClick={() => handleCheckoutNavigation("online")}
              disabled={cart.length === 0}
              className={`w-full py-3.5 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-[1.02]
                ${
                  cart.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                    : `${ACCENT_COLOR} text-white shadow-green-400/50 hover:bg-green-600`
                }`}
            >
              💳 Thanh toán Online
            </button>
            
            {/* Quay lại mua sắm */}
            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 py-3 border border-gray-300 text-gray-600 font-semibold text-base rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" /> Tiếp tục mua sắm
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Cart;
