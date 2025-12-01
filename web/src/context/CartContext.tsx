import React, { createContext, useContext, useEffect, useState } from "react";

// Cart item interface
export interface CartItemType {
  productId: string;
  variantId?: string;
  productName: string;
  price: number;
  quantity: number;
  productImage: string;
}

// Context interface
interface CartContextType {
  cart: CartItemType[];
  addToCart: (product: any, quantity?: number) => void;
  addItems: (items: CartItemType[]) => void; // Thêm nhiều item
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
}

// Context & hook
const CartContext = createContext<CartContextType | null>(null);
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

// Provider
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItemType[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("localCart") || "{}");
      let items: any[] = [];
      if (stored && Array.isArray(stored.items)) items = stored.items;
      else if (Array.isArray(stored)) items = stored;

      return items.map(item => {
        // Lấy ảnh an toàn
        let img: string;
        if (item.productImage) img = item.productImage;
        else if (item.primaryImage) img = item.primaryImage;
        else if (Array.isArray(item.images) && item.images.length > 0) {
          const first = item.images[0];
          img = typeof first === "string" ? first : first.url || "";
        } else img = "";

        return {
          productId: item.productId || item._id,
          variantId: item.variantId || undefined,
          productName: item.productName || item.name || "Unknown",
          price: item.price || 0,
          quantity: item.quantity || 1,
          productImage:
            img && typeof img === "string"
              ? img.startsWith("http")
                ? img
                : `/${img.replace(/^\//, "")}`
              : "https://via.placeholder.com/80x80?text=No+Image",
        };
      });
    } catch {
      return [];
    }
  });

  // Lưu vào localStorage khi cart thay đổi
  useEffect(() => {
    localStorage.setItem("localCart", JSON.stringify({ items: cart }));
  }, [cart]);

  // Thêm 1 sản phẩm
  const addToCart = (product: any, quantity: number = 1) => {
    const productId = product.productId || product._id || product.id;
    const variantId = product.variantId || product.selectedVariantId || undefined;

    if (!productId) return;

    let image: string;
    if (product.productImage) image = product.productImage;
    else if (product.primaryImage) image = product.primaryImage;
    else if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      image = typeof first === "string" ? first : first.url || "";
    } else image = "";

    setCart(prev => {
      const exist = prev.find(i => i.productId === productId && i.variantId === variantId);
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
          productName: product.productName || product.name || "Unknown",
          price: product.price || 0,
          quantity,
          productImage:
            image && typeof image === "string"
              ? image.startsWith("http")
                ? image
                : `/${image.replace(/^\//, "")}`
              : "https://via.placeholder.com/80x80?text=No+Image",
        },
      ];
    });
  };

  // Thêm nhiều sản phẩm
  const addItems = (items: CartItemType[]) => {
    setCart(prev => {
      const newCart = [...prev];
      items.forEach(item => {
        const exist = newCart.find(i => i.productId === item.productId && i.variantId === item.variantId);
        if (exist) exist.quantity += item.quantity;
        else newCart.push(item);
      });
      return newCart;
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

  // Xóa sản phẩm
  const removeItem = (productId: string, variantId?: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)));
  };

  // Xóa toàn bộ
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, addItems, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
