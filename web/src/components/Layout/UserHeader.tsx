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

  const updateInfo = () => {
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
  };

  useEffect(() => {
    updateInfo();
    window.addEventListener("storage", updateInfo);
    return () => window.removeEventListener("storage", updateInfo);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUserName(null);
    setItemCount(0);
    navigate("/login");
  };

  return (
    // Header container: Giữ nguyên style nền/border nhưng chỉnh shadow nhẹ hơn
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 shadow-sm transition-all duration-300">
      
      {/* Wrapper: Căn giữa, padding hợp lý */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> {/* Chiều cao cố định h-20 (80px) là chuẩn */}
          
          {/* 1. Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="text-2xl md:text-3xl font-black text-amber-900 tracking-tighter uppercase hover:opacity-80 transition-opacity"
            >
              Fashion<span className="font-light text-amber-700">Store</span>
            </Link>
          </div>

          {/* 2. Navigation Section - Căn chỉnh lại font-size và spacing */}
          <nav className="hidden lg:flex items-center space-x-8"> {/* space-x-10 -> space-x-8 cho gọn hơn */}
            {[
              { name: "Trang chủ", path: "/" },
              { name: "Sản phẩm", path: "/products" },
              { name: "Nổi bật", path: "/products?isFeatured=true" },
              { name: "Đơn hàng", path: "/orders" },
            ].map((item) => (
              <Link
                key={item.name}
                to={item.path}
                // Chỉnh text-lg -> text-base (16px) hoặc text-sm (14px) uppercase để sang hơn
                // Thêm font-bold để rõ nét
                className="relative text-stone-600 hover:text-amber-900 font-bold text-base transition-colors group tracking-wide py-2"
              >
                {item.name}
                {/* Underline effect tinh tế hơn */}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-800 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* 3. Actions Area */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-stone-600 hover:text-amber-900 hover:bg-stone-50 rounded-full transition-all"
            >
              <ShoppingCart className="h-6 w-6 stroke-2" /> {/* h-7 -> h-6 chuẩn icon */}
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-amber-700 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white transform translate-x-1 -translate-y-1">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Divider */}
            <div className="h-6 w-px bg-stone-300 hidden sm:block" />

            {/* User Info / Login Buttons */}
            {userName ? (
              <div className="flex items-center gap-3 md:gap-4">
                <Link
                  to="/profile"
                  className="group flex items-center gap-3 pl-1 pr-3 py-1 hover:bg-stone-50 rounded-full transition-all"
                >
                  <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200 group-hover:bg-amber-200 transition-colors">
                    <User className="h-5 w-5 text-amber-900" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider leading-tight">Hello</p>
                    <p className="text-sm font-bold text-stone-900 leading-tight max-w-[100px] truncate">{userName}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  // Chỉnh lại padding và font-size cho nút Đăng nhập
                  className="hidden sm:block px-4 py-2 text-sm font-bold text-stone-600 hover:text-amber-900 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  // Nút Đăng ký gọn hơn
                  className="px-6 py-2.5 text-sm font-bold text-white bg-amber-900 hover:bg-amber-950 rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;