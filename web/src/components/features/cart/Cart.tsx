import React, { useEffect } from "react";
import CartItem from "./CartItem";
import { useCart } from "./CartContext";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck } from "lucide-react"; // Thêm icon cho sinh động (tùy chọn)

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
    // Container chính: Tăng padding top để tránh header fixed, dùng màu nền trắng sạch
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pt-28 pb-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Tiêu đề phong cách FashionStore: To, Đậm, Tracking chặt */}
      <h2 className="text-3xl md:text-4xl font-black text-stone-900 mb-8 uppercase tracking-tighter flex items-end gap-3">
        Giỏ hàng của bạn 
        <span className="text-xl md:text-2xl font-light text-stone-400 normal-case mb-1">
          ({totalItems} sản phẩm)
        </span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- CỘT TRÁI: DANH SÁCH SẢN PHẨM (Chiếm 8 phần) --- */}
        <div className="lg:col-span-8">
          <div className="space-y-6"> 
            <AnimatePresence>
              {cart.length > 0 ? (
                cart.map(item => (
                  // Bọc CartItem trong div border để phân cách rõ ràng
                  <motion.div 
                    key={item.productId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-stone-100 pb-6 last:border-0"
                  >
                    <CartItem
                      item={item}
                      onUpdate={updateQuantity}
                      onRemove={removeItem}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="text-center py-20 bg-stone-50 rounded-lg border border-dashed border-stone-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-stone-500 text-lg mb-4">Giỏ hàng của bạn đang trống.</p>
                  <button 
                    onClick={() => navigate('/products')}
                    className="text-stone-900 font-bold underline hover:text-amber-700 transition-colors"
                  >
                    Khám phá sản phẩm ngay
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Nút Back (Desktop position) */}
          <button
            onClick={() => window.history.back()}
            className="hidden lg:flex items-center gap-2 mt-8 text-stone-500 hover:text-stone-900 font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Tiếp tục mua sắm
          </button>
        </div>

        {/* --- CỘT PHẢI: TỔNG TIỀN & THANH TOÁN (Chiếm 4 phần) --- */}
        <div className="lg:col-span-4">
          <div className="bg-stone-50 p-6 md:p-8 rounded-xl sticky top-28 border border-stone-100">
            <h3 className="text-xl font-bold text-stone-900 uppercase tracking-wide mb-6">
              Tóm tắt đơn hàng
            </h3>

            <div className="space-y-4 mb-8 border-b border-stone-200 pb-6">
              <div className="flex justify-between text-stone-600">
                <span>Tạm tính</span>
                <span>{total.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Vận chuyển</span>
                <span className="text-stone-400 text-sm">Tính ở bước sau</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-stone-900">Tổng cộng</span>
                <span className="text-2xl font-black text-stone-900">
                  {total.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              {/* Nút Thanh toán Online - Style Đen (Primary) */}
              <button
                onClick={() => handleCheckoutNavigation("online")}
                disabled={cart.length === 0}
                className={`w-full py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-all
                  ${cart.length === 0
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                    : "bg-stone-900 text-white hover:bg-black hover:shadow-lg active:transform active:scale-95"
                  }`}
              >
                <CreditCard className="w-4 h-4" />
                Thanh toán Online
              </button>

              {/* Nút COD - Style Trắng viền (Secondary) */}
              <button
                onClick={() => handleCheckoutNavigation("cod")}
                disabled={cart.length === 0}
                className={`w-full py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider rounded-lg border transition-all
                  ${cart.length === 0
                    ? "border-stone-200 text-stone-300 cursor-not-allowed"
                    : "bg-white border-stone-300 text-stone-900 hover:border-stone-900 hover:bg-stone-50"
                  }`}
              >
                <Truck className="w-4 h-4" />
                Thanh toán khi nhận hàng
              </button>
            </div>

            {/* Nút Back (Mobile position) */}
            <button
              onClick={() => window.history.back()}
              className="lg:hidden w-full mt-4 py-3 text-stone-500 font-medium hover:text-stone-900 transition-colors text-sm"
            >
              Quay lại mua sắm
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Cart;