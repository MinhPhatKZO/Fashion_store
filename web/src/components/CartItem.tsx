import React from "react";
import { motion } from "framer-motion";
import { CartItemType } from "../context/CartContext";

interface CartItemProps {
  item: CartItemType;
  onUpdate: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdate, onRemove }) => {
  const handleDecrease = () => {
    const newQuantity = item.quantity - 1;
    if (newQuantity < 1) onRemove(item.productId);
    else onUpdate(item.productId, newQuantity);
  };

  const handleIncrease = () => onUpdate(item.productId, item.quantity + 1);

  const finalImageUrl = item.productImage || "https://via.placeholder.com/120x120?text=No+Image";

  return (
    <motion.div
  key={item.productId}
  className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 py-6 px-4 bg-white hover:shadow-lg rounded-2xl mb-4 transition-transform duration-200 hover:-translate-y-1"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, height: 0, paddingBottom: 0, overflow: 'hidden', transition: { duration: 0.3 } }}
  transition={{ duration: 0.3 }}
>
  {/* Hình ảnh + thông tin */}
  <div className="flex items-center space-x-5 w-full sm:w-auto mb-4 sm:mb-0">
    <img src={finalImageUrl} alt={item.productName} className="w-28 h-28 object-cover rounded-xl shadow-md border border-gray-100" />
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-1">{item.productName}</h3>
      <p className="text-gray-500">Giá: {item.price.toLocaleString()} ₫</p>
      <p className="text-gray-700 font-semibold mt-1">Tổng: {(item.price * item.quantity).toLocaleString()} ₫</p>
    </div>
  </div>

  {/* Số lượng + xóa */}
  <div className="flex items-center space-x-4">
    <div className="flex items-center border border-gray-300 rounded-full overflow-hidden shadow-sm">
      <button
        onClick={handleDecrease}
        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-lg rounded-l-full transition-colors"
        >
        -
        </button>

        <button
        onClick={handleIncrease}
        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-lg rounded-r-full transition-colors"
        >
        +
        </button>

    </div>

    <button
        onClick={() => onRemove(item.productId)}
        className="text-red-500 hover:text-red-700 text-2xl p-2 rounded-full hover:bg-red-50 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
        🗑️
        </button>

  </div>
</motion.div>

  );
};

export default CartItem;
