import React from "react";
import { motion } from "framer-motion";

interface CartItemType {
  productId: string;
  variantId?: string;
  quantity: number;
  productName: string;
  price: number;
  productImage?: string;
}

interface CartItemProps {
  item: CartItemType;
  onUpdate: (productId: string, variantId: string | undefined, quantity: number) => void;
  onRemove: (productId: string, variantId?: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdate, onRemove }) => {
  const { productId, variantId, quantity } = item;

  const handleRemove = () => onRemove(productId, variantId);
  const handleDecrease = () => {
    const newQuantity = quantity - 1;
    if (newQuantity < 1) handleRemove();
    else onUpdate(productId, variantId, newQuantity);
  };
  const handleIncrease = () => onUpdate(productId, variantId, quantity + 1);

  const finalImageUrl =
    item.productImage || "https://placehold.co/120x120/E5E7EB/4B5563?text=No+Image";

  return (
    <motion.div
      key={productId + (variantId || "")}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 py-4 sm:py-6 px-2 sm:px-4 bg-white transition-colors duration-200"
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        height: 0,
        paddingBottom: 0,
        paddingTop: 0,
        overflow: "hidden",
        transition: { duration: 0.3 },
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Hình ảnh + thông tin */}
      <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto flex-grow mb-3 sm:mb-0 min-w-0">
        <img
          src={finalImageUrl}
          alt={item.productName}
          className="w-28 h-28 object-cover rounded-lg shadow-sm border border-gray-200 flex-shrink-0"
        />
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 truncate">
            {item.productName}
          </h3>
          {item.variantId && (
            <p className="text-sm text-gray-400 italic">Mã biến thể: {item.variantId.substring(0, 8)}...</p>
          )}
          <p className="text-gray-600 mt-1">
            Đơn giá: <span className="font-medium text-blue-600">{item.price.toLocaleString()} ₫</span>
          </p>
        </div>
      </div>

      {/* Số lượng + tổng tiền + xóa */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
        {/* Nút số lượng */}
        <div className="flex items-center border border-gray-300 rounded-full overflow-hidden shadow-sm">
          <button
            onClick={handleDecrease}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-base transition-colors disabled:opacity-50"
            disabled={quantity <= 1}
          >
            -
          </button>
          <div className="w-10 text-center text-base sm:text-lg font-bold text-gray-800 select-none">
            {quantity}
          </div>
          <button
            onClick={handleIncrease}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-base transition-colors"
          >
            +
          </button>
        </div>

        {/* Tổng tiền item */}
        <p className="text-lg sm:text-xl font-bold text-blue-700 w-24 text-right">
          {(item.price * quantity).toLocaleString()} ₫
        </p>

        {/* Nút xóa */}
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700 text-xl sm:text-2xl p-2 rounded-full hover:bg-red-50 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Xóa
        </button>
      </div>
    </motion.div>
  );
};

export default CartItem;
