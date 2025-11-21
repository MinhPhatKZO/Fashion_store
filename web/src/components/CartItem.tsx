import React from "react";
import { motion } from "framer-motion";
import { CartItemType } from "../context/CartContext";

// Định nghĩa lại interface CartItemProps
interface CartItemProps {
    item: CartItemType;
    // Hàm onUpdate đã đúng (cần 2 ID)
    onUpdate: (productId: string, variantId: string | undefined, quantity: number) => void;
    
    // ⭐ ĐÃ SỬA: Hàm onRemove cần cả productId và variantId để khớp với CartContext
    onRemove: (productId: string, variantId?: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdate, onRemove }) => {
    
    const { productId, variantId, quantity } = item;
    
    // ⭐ Hàm xử lý Xóa sản phẩm
    const handleRemove = () => {
        // ⭐ QUAN TRỌNG: Truyền cả productId VÀ variantId (nếu có)
        onRemove(productId, variantId); 
    };

    const handleDecrease = () => {
        const newQuantity = quantity - 1;
        
        if (newQuantity < 1) {
            handleRemove(); // Gọi hàm xóa đã sửa
        } else {
            onUpdate(productId, variantId, newQuantity);
        }
    };

    const handleIncrease = () => {
        onUpdate(productId, variantId, quantity + 1);
    };

    const finalImageUrl =
        item.productImage || "https://via.placeholder.com/120x120?text=No+Image";

    return (
        <motion.div
            // Sửa key để phân biệt các biến thể khác nhau của cùng một sản phẩm
            key={productId + (variantId || '')} 
            className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 py-6 px-4 bg-white hover:shadow-lg rounded-2xl mb-4 transition-transform duration-200 hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
                opacity: 0,
                height: 0,
                paddingBottom: 0,
                overflow: "hidden",
                transition: { duration: 0.3 },
            }}
            transition={{ duration: 0.3 }}
        >
            {/* Hình ảnh + thông tin */}
            <div className="flex items-center space-x-5 w-full sm:w-auto mb-4 sm:mb-0">
                <img
                    src={finalImageUrl}
                    alt={item.productName}
                    className="w-28 h-28 object-cover rounded-xl shadow-md border border-gray-100"
                />
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {item.productName}
                    </h3>
                    <p className="text-gray-500">
                        Giá: {item.price.toLocaleString()} ₫
                    </p>
                    <p className="text-gray-700 font-semibold mt-1">
                        Tổng: {(item.price * quantity).toLocaleString()} ₫
                    </p>
                </div>
            </div>

            {/* Số lượng + nút xóa */}
            <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-full overflow-hidden shadow-sm">
                    <button
                        onClick={handleDecrease}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-lg rounded-l-full transition-colors"
                    >
                        -
                    </button>

                    {/* Hiển thị số lượng */}
                    <div className="px-4 py-2 text-lg font-semibold select-none">
                        {quantity}
                    </div>

                    <button
                        onClick={handleIncrease}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-lg rounded-r-full transition-colors"
                    >
                        +
                    </button>
                </div>

                {/* Xóa sản phẩm */}
                <button
                    onClick={handleRemove} // ⭐ GỌI HÀM XÓA ĐÃ SỬA
                    className="text-red-500 hover:text-red-700 text-2xl p-2 rounded-full hover:bg-red-50 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                    🗑️
                </button>
            </div>
        </motion.div>
    );
};

export default CartItem;