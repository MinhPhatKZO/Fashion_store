// context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItemType {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subtotal: number;
}

interface CartContextType {
  cart: { items: CartItemType[]; totalPrice: number };
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItemQuantity: (productId: string, quantity: number) => Promise<void>;
  removeCartItem: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ✅ Hàm lấy thông tin đăng nhập
const getAuthData = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    return { userId: user?._id || null, token: token || null };
  } catch {
    return { userId: null, token: null };
  }
};

// ✅ Giỏ hàng local
const getLocalCart = (): { items: CartItemType[], totalPrice: number } => {
  try {
    const saved = localStorage.getItem("localCart");
    return saved ? JSON.parse(saved) : { items: [], totalPrice: 0 };
  } catch {
    return { items: [], totalPrice: 0 };
  }
};

const saveLocalCart = (cart: { items: CartItemType[], totalPrice: number }) => {
  localStorage.setItem("localCart", JSON.stringify(cart));
};

// ✅ Lấy chi tiết sản phẩm (để thêm local)
const fetchProductDetails = async (productId: string): Promise<CartItemType | null> => {
  try {
    const res = await fetch(`http://localhost:5000/api/products/${productId}`);
    const data = await res.json();
    const product = data.product;

    const imageUrl =
      product.images?.[0]?.url ||
      product.images?.[0] ||
      "https://via.placeholder.com/100x100?text=Image";

    return {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl,
      subtotal: product.price,
    };
  } catch (err) {
    console.error("Fetch product error:", err);
    return null;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<{ items: CartItemType[]; totalPrice: number }>(getLocalCart());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTotal = (items: CartItemType[]) =>
    items.reduce((t, i) => t + i.subtotal, 0);

  // ✅ Lấy giỏ hàng (server hoặc local)
  const fetchCart = useCallback(async () => {
    const { userId, token } = getAuthData();

    if (userId && token) {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/cart/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Server fetch failed");
        const data = await res.json();
        setCart(data.cart || data);
        // Xóa local cart khi sync xong
        localStorage.removeItem("localCart");
      } catch (err) {
        console.error("Fetch cart error:", err);
        setError("Không thể tải giỏ hàng từ máy chủ");
      } finally {
        setLoading(false);
      }
    } else {
      setCart(getLocalCart());
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ Thêm sản phẩm
  const addToCart = async (productId: string, quantity: number = 1) => {
    const { userId, token } = getAuthData();

    if (userId && token) {
      try {
        const res = await fetch("http://localhost:5000/api/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, productId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Add failed");
        setCart(data.cart);
      } catch (err) {
        console.error("Add to cart (server) error:", err);
        throw err;
      }
    } else {
      // Local cart
      const local = getLocalCart();
      const existing = local.items.find((i) => i.productId === productId);

      let updatedItems;
      if (existing) {
        updatedItems = local.items.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * i.price }
            : i
        );
      } else {
        const newItem = await fetchProductDetails(productId);
        if (!newItem) throw new Error("Không thể thêm sản phẩm local");
        updatedItems = [...local.items, { ...newItem, quantity, subtotal: newItem.price * quantity }];
      }

      const newCart = { items: updatedItems, totalPrice: calculateTotal(updatedItems) };
      saveLocalCart(newCart);
      setCart(newCart);
    }
  };

  // ✅ Cập nhật số lượng
  const updateCartItemQuantity = async (productId: string, quantity: number) => {
    const { userId, token } = getAuthData();

    if (userId && token) {
      try {
        const res = await fetch("http://localhost:5000/api/cart/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, productId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Update failed");
        setCart(data.cart);
      } catch (err) {
        console.error("Update server cart error:", err);
      }
    } else {
      const local = getLocalCart();
      const updatedItems = local.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, subtotal: quantity * i.price }
          : i
      );
      const newCart = { items: updatedItems, totalPrice: calculateTotal(updatedItems) };
      saveLocalCart(newCart);
      setCart(newCart);
    }
  };

  // ✅ Xóa sản phẩm
  const removeCartItem = async (productId: string) => {
    const { userId, token } = getAuthData();

    if (userId && token) {
      try {
        const res = await fetch("http://localhost:5000/api/cart/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId, productId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Remove failed");
        setCart(data.cart);
      } catch (err) {
        console.error("Remove server cart error:", err);
      }
    } else {
      const local = getLocalCart();
      const updatedItems = local.items.filter((i) => i.productId !== productId);
      const newCart = { items: updatedItems, totalPrice: calculateTotal(updatedItems) };
      saveLocalCart(newCart);
      setCart(newCart);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
