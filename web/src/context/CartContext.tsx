import React, { createContext, useContext, useEffect, useState } from "react";

// Cart item interface
export interface CartItemType {
    productId: string;
    variantId?: string; // ⭐ Dùng optional string
    productName: string;
    price: number;
    quantity: number;
    productImage: string;
}

// Context interface
interface CartContextType {
    cart: CartItemType[];
    addToCart: (product: any, quantity?: number) => void;
    // Cần truyền đủ 2 ID để xác định item duy nhất
    updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
    removeItem: (productId: string, variantId?: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

// hook
export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
};

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    // 🔥 Load cart từ localStorage một cách chuẩn xịn
    const [cart, setCart] = useState<CartItemType[]>(() => {
        try {
            const stored = JSON.parse(localStorage.getItem("localCart") || "{}");
            let items: any[] = [];

            if (stored && Array.isArray(stored.items)) items = stored.items;
            else if (Array.isArray(stored)) items = stored;

            return items.map(item => ({
                productId: item.productId || item._id,
                // Đảm bảo variantId là null hoặc string
                variantId: item.variantId || undefined, 
                productName: item.productName || item.name || "Unknown",
                price: item.price || 0,
                quantity: item.quantity || 1,
                productImage:
                    item.productImage ||
                    item.primaryImage ||
                    (item.images ? item.images[0] : "https://via.placeholder.com/80?text=No+Image")
            }));
        } catch {
            return [];
        }
    });

    // 🔥 Lưu cart vào localStorage mỗi khi thay đổi
    useEffect(() => {
        // Lưu toàn bộ mảng items vào key 'localCart'
        localStorage.setItem("localCart", JSON.stringify({ items: cart })); 
    }, [cart]);

    // Thêm sản phẩm
    const addToCart = (product: any, quantity: number = 1) => {
        const productId = product.productId || product._id || product.id;
        const variantId = product.variantId || product.selectedVariantId || undefined; // Dùng undefined

        if (!productId) return;

        const image =
            product.productImage ||
            product.primaryImage ||
            (Array.isArray(product.images) && product.images[0]) ||
            "https://via.placeholder.com/80x80?text=No+Image";

        setCart(prev => {
            const exist = prev.find(
                // So sánh cả hai ID để đảm bảo tính duy nhất
                i => i.productId === productId && i.variantId === variantId
            );

            
            if (exist) {
                return prev.map(i =>
                    i.productId === productId && i.variantId === variantId
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            }

            return [
                ...prev,
                {
                    productId,
                    variantId,
                    productName: product.productName || product.name,
                    price: product.price,
                    quantity,
                    productImage: image.startsWith("http") ? image : `/${image.replace(/^\//, "")}`
                }
            ];
        });
    };

    // Cập nhật số lượng
    const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
        setCart(prev =>
            prev
                .map(item =>
                    item.productId === productId && item.variantId === variantId
                        ? { ...item, quantity }
                        : item
                )
                .filter(i => i.quantity > 0)
        );
    };

    // Xóa một sản phẩm: Lọc bỏ dựa trên cả hai ID
    const removeItem = (productId: string, variantId?: string) => {
        setCart(prev =>
            // Logic lọc: Nếu cả productId và variantId đều khớp, thì lọc bỏ (trả về false)
            prev.filter(i => !(i.productId === productId && i.variantId === variantId))
        );
    };

    // Xóa toàn bộ
    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider
            value={{ cart, addToCart, updateQuantity, removeItem, clearCart }}
        >
            {children}
        </CartContext.Provider>
    );
};