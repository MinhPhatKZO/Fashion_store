import React from "react";
import { motion } from "framer-motion";

// Đã cập nhật interface để đồng bộ với CartContext đã cung cấp
export interface CartItemType {
  productId: string;
  name: string; // Đổi từ productName
  price: number;
  quantity: number;
  subtotal: number; // Vẫn giữ subtotal, nhưng sẽ tính lại khi render
  imageUrl?: string; // Đổi từ productImage
}

interface CartItemProps {
  item: CartItemType;
  onUpdate: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdate, onRemove }) => {
  // Sử dụng item.name và item.imageUrl
  const currentSubtotal = item.price * item.quantity;

  return (
    <motion.div
      className="flex items-center justify-between border-b py-4 hover:bg-gray-50 rounded-md transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-4">
        <img
          // Sử dụng item.imageUrl và đảm bảo đường dẫn luôn bắt đầu bằng /
          src={item.imageUrl?.startsWith('/') ? item.imageUrl : `/${item.imageUrl}` || "/assets/no-image.jpg"}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg border shadow-sm"
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {item.name}
          </h3>
          <p className="text-sm text-gray-500">
            Giá: {item.price.toLocaleString("vi-VN")} ₫
          </p>
          <div className="flex items-center mt-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              // Chỉ cho phép giảm nếu quantity > 1
              onClick={() => item.quantity > 1 && onUpdate(item.productId, item.quantity - 1)}
              className={`px-3 py-1 bg-gray-200 rounded-l transition 
                ${item.quantity > 1 ? 'hover:bg-gray-300' : 'opacity-50 cursor-not-allowed'}`}
              disabled={item.quantity <= 1}
            >
              -
            </motion.button>
            <input
              type="number"
              value={item.quantity}
              readOnly
              className="w-12 text-center border-t border-b text-gray-800"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdate(item.productId, item.quantity + 1)}
              className="px-3 py-1 bg-gray-200 rounded-r hover:bg-gray-300 transition"
            >
              +
            </motion.button>
          </div>
        </div>
      </div>

      <motion.div
        // Sử dụng key là subtotal tính toán để kích hoạt animation khi giá trị thay đổi
        key={currentSubtotal}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center space-x-6"
      >
        <span className="text-lg font-semibold text-gray-800">
          {currentSubtotal.toLocaleString("vi-VN")} ₫
        </span>
        <button
          onClick={() => onRemove(item.productId)}
          className="text-red-500 hover:text-red-700 text-xl transition-transform hover:scale-110"
        >
          🗑️
        </button>
      </motion.div>
    </motion.div>
  );
};

export default CartItem;