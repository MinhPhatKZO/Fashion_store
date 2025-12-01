import React, { useState, useMemo, useEffect } from 'react';
import { X, ShoppingCart, Loader2 } from 'lucide-react';

// Tái sử dụng Interfaces từ ProductDetail
interface ProductVariant {
    _id: string;
    productId: string;
    sku: string;
    size: string;
    color: string;
    price: number;
    comparePrice?: number;
    stock: number;
}

interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    images?: any; 
}

interface VariantSelectionModalProps {
    product: Product & { variants: ProductVariant[] }; // Sản phẩm kèm theo biến thể
    onClose: () => void;
    onAddToCart: (item: any) => void; // Hàm add to cart
    getImageUrl: (p: Product) => string; // Hàm lấy URL ảnh
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({ 
    product, 
    onClose, 
    onAddToCart, 
    getImageUrl 
}) => {
    const { variants } = product;
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // Set variant mặc định khi modal mở
    useEffect(() => {
        if (variants.length > 0) {
            const defaultVariant = variants.find(v => v.stock > 0) || variants[0];
            setSelectedVariant(defaultVariant);
        }
    }, [variants]);

    // Lấy danh sách Size và Color duy nhất
    const uniqueAttributes = useMemo(() => {
        const allSizes = Array.from(new Set(variants.map(v => v.size))).filter(s => s);
        const allColors = Array.from(new Set(variants.map(v => v.color))).filter(c => c);
        return { allSizes, allColors };
    }, [variants]);

    const selectedSize = selectedVariant?.size || "";
    const selectedColor = selectedVariant?.color || "";
    
    const displayPrice = selectedVariant?.price || product.price;
    const displayStock = selectedVariant?.stock ?? product.stock;
    const isOutOfStock = displayStock <= 0;

    // Logic chọn biến thể (Tương tự ProductDetail)
    const handleSelectVariant = (type: "size" | "color", val: string) => {
        let size = selectedSize;
        let color = selectedColor;

        if (type === "size") size = val;
        if (type === "color") color = val;

        // Tìm variant khớp chính xác
        let variant = variants.find(v => v.size === size && v.color === color);
        
        // Nếu không tìm thấy, cố gắng tìm variant khác còn hàng
        if (!variant) {
             if (type === 'size') {
                 variant = variants.find(v => v.size === size && v.stock > 0);
             } else {
                 variant = variants.find(v => v.color === color && v.stock > 0);
             }
        }
        
        setSelectedVariant(variant || null);
    };

    const handleConfirmAddToCart = () => {
        if (!selectedVariant) {
            alert("Vui lòng chọn một biến thể hợp lệ.");
            return;
        }

        if (selectedVariant.stock <= 0) {
            alert("Biến thể này đã hết hàng!");
            return;
        }

        const item = {
            productId: product._id, 
            variantId: selectedVariant._id,
            productName: `${product.name} (${selectedVariant.size}/${selectedVariant.color})`,
            price: selectedVariant.price,
            quantity: 1, 
            productImage: getImageUrl(product),
        };
        
        onAddToCart(item);
        onClose(); // Đóng modal sau khi thêm
    };

    // Kiểm tra xem một size/color có sẵn (còn hàng) cho các lựa chọn hiện tại không
    const isAttributeAvailable = (type: 'size' | 'color', val: string) => {
        if (type === 'size') {
            return variants.some(v => v.size === val && (v.color === selectedColor || !selectedColor) && v.stock > 0);
        } else { // type === 'color'
            return variants.some(v => v.color === val && (v.size === selectedSize || !selectedSize) && v.stock > 0);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative p-6">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 border-b pb-3 mb-4 flex items-center">
                    Chọn Biến thể: {product.name}
                </h2>

                <div className="flex gap-4 mb-4">
                    <img src={getImageUrl(product)} alt={product.name} className="w-24 h-24 object-cover rounded-lg shadow-md" />
                    <div className='flex-1'>
                        <p className="text-2xl font-bold text-blue-600">
                            {displayPrice.toLocaleString("vi-VN")}₫
                        </p>
                        <p className={`text-sm font-medium ${isOutOfStock ? "text-red-500" : "text-green-600"}`}>
                            Tồn kho: {isOutOfStock ? "Hết hàng" : `${displayStock} sản phẩm`}
                        </p>
                    </div>
                </div>

                {/* Khu vực chọn Size */}
                {uniqueAttributes.allSizes.length > 0 && (
                    <div className="mb-4">
                        <p className="font-semibold text-gray-700 mb-2">Size: <span className="text-blue-600">{selectedSize || 'Chưa chọn'}</span></p>
                        <div className="flex flex-wrap gap-3">
                            {uniqueAttributes.allSizes.map(size => {
                                const isSelected = size === selectedSize;
                                const isAvailable = isAttributeAvailable('size', size);
                                return (
                                    <button
                                        key={size}
                                        onClick={() => isAvailable && handleSelectVariant('size', size)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm
                                            ${isSelected 
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : isAvailable
                                                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                            }
                                        `}
                                        disabled={!isAvailable && !isSelected}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {/* Khu vực chọn Color */}
                {uniqueAttributes.allColors.length > 0 && (
                    <div className="mb-6">
                        <p className="font-semibold text-gray-700 mb-2">Màu sắc: <span className="text-blue-600">{selectedColor || 'Chưa chọn'}</span></p>
                        <div className="flex flex-wrap gap-3">
                             {uniqueAttributes.allColors.map(color => {
                                const isSelected = color === selectedColor;
                                const isAvailable = isAttributeAvailable('color', color);
                                return (
                                    <button
                                        key={color}
                                        onClick={() => isAvailable && handleSelectVariant('color', color)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm
                                            ${isSelected 
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : isAvailable
                                                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                            }
                                        `}
                                        disabled={!isAvailable && !isSelected}
                                    >
                                        {color}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Nút Thêm vào Giỏ hàng */}
                <button
                    onClick={handleConfirmAddToCart}
                    disabled={variants.length > 0 && !selectedVariant || isOutOfStock}
                    className={`w-full py-3 rounded-xl transition font-semibold text-base flex items-center justify-center shadow-lg
                        ${(variants.length > 0 && !selectedVariant) || isOutOfStock
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
                    `}
                >
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    {isOutOfStock ? "Hết hàng" : "Xác nhận và Thêm vào Giỏ"}
                </button>
            </div>
        </div>
    );
};

export default VariantSelectionModal;