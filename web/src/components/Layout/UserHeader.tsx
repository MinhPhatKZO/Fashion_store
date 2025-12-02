// Header.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface CartStorage {
  items?: CartItem[];
}

const Header: React.FC = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    setUserName(name);

    const storedCart = localStorage.getItem("localCart");
    if (storedCart) {
      try {
        const cart: CartStorage = JSON.parse(storedCart);
        const totalItems = cart.items
          ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
          : 0;
        setItemCount(totalItems);
      } catch {
        setItemCount(0);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedCart = localStorage.getItem("localCart");
      if (storedCart) {
        try {
          const cart: CartStorage = JSON.parse(storedCart);
          const totalItems = cart.items
            ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
            : 0;
          setItemCount(totalItems);
        } catch {
          setItemCount(0);
        }
      } else {
        setItemCount(0);
      }

      setUserName(localStorage.getItem("userName"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUserName(null);
    setItemCount(0);
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-20 px-8 flex items-center justify-between">
        <Link
          to="/"
          className="text-3xl font-extrabold text-indigo-600 tracking-wide hover:text-indigo-700 transition"
        >
          Fashion Store
        </Link>

        <nav className="hidden md:flex items-center space-x-10 flex-1 justify-center">
          <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium text-lg">
            Trang chủ
          </Link>
          <Link to="/products" className="text-gray-700 hover:text-indigo-600 font-medium text-lg">
            Sản phẩm
          </Link>
          <Link
            to="/products?isFeatured=true"
            className="text-gray-700 hover:text-indigo-600 font-medium text-lg"
          >
            Nổi bật
          </Link>
          <Link to="/orders" className="text-gray-700 hover:text-indigo-600 font-medium text-lg">
            Đơn hàng
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <Link
            to="/cart"
            className="relative text-gray-700 hover:text-indigo-600 transition-transform hover:scale-110"
          >
            <ShoppingCart className="h-7 w-7" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {userName ? (
            <div className="flex items-center gap-4">
              {/* Thêm Link tới profile */}
              <Link
                to="/profile"
                className="text-gray-700 font-semibold flex items-center gap-2 text-lg hover:text-indigo-600 transition"
              >
                <User className="h-6 w-6 text-indigo-600" />
                {userName}
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-md"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
