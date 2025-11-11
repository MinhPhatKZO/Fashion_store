import React, { createContext, useContext, useEffect, useState } from "react";

// Cart item interface
export interface CartItemType {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  productImage?: string;
}

// Context interface
interface CartContextType {
  cart: CartItemType[];
  addToCart: (product: any, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

// Tạo context
const CartContext = createContext<CartContextType | null>(null);
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load cart từ localStorage
  const [cart, setCart] = useState<CartItemType[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("localCart") || "{}");
      let items: any[] = [];
      if (stored && Array.isArray(stored.items)) items = stored.items;
      else if (Array.isArray(stored)) items = stored;

      // Chuẩn hóa mỗi sản phẩm
      return items.map(item => ({
        productId: item.productId || item._id || item.id || `temp-${Math.random().toString(36).slice(2, 10)}`,
        productName: item.productName || item.name || "Unknown",
        price: item.price || 0,
        quantity: item.quantity || 1,
        productImage: item.productImage || item.primaryImage || (item.images ? item.images[0] : "")
      }));
    } catch {
      return [];
    }
  });

  // Lưu cart vào localStorage
  useEffect(() => {
    localStorage.setItem("localCart", JSON.stringify({ items: cart }));
  }, [cart]);

  // Thêm sản phẩm
  const addToCart = (product: any, quantity: number = 1) => {
    const productId = product._id || product.id;
    if (!productId) return;

    const image =
      product.productImage ||
      product.primaryImage ||
      (Array.isArray(product.images) && product.images[0]) ||
      "https://via.placeholder.com/80x80?text=No+Image";

    setCart(prev => {
      const exist = prev.find(i => i.productId === productId);
      if (exist) {
        return prev.map(i =>
          i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          productId,
          productName: product.name,
          price: product.price,
          quantity,
          productImage: image.startsWith("http") ? image : `/${image.replace(/^\//, "")}`
        }
      ];
    });
  };

  // Cập nhật số lượng
  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
        .filter(i => i.quantity > 0)
    );
  };

  // Xóa 1 sản phẩm
  const removeItem = (productId: string) => {
    if (!productId) return;
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  // Xóa toàn bộ giỏ
  const clearCart = () => {
    setCart([]);
    localStorage.setItem("localCart", JSON.stringify({ items: [] }));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
