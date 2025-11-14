import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut } from "lucide-react";

const SellerHeader: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
    setUserName(localStorage.getItem("userName"));

    const storedCart = localStorage.getItem("localCart");
    if (storedCart) {
      try {
        const cart = JSON.parse(storedCart);
        const totalItems = cart.items
          ? cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          : 0;
        setItemCount(totalItems);
      } catch {
        setItemCount(0);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setUserName(localStorage.getItem("userName"));
      const storedCart = localStorage.getItem("localCart");
      if (storedCart) {
        try {
          const cart = JSON.parse(storedCart);
          const totalItems = cart.items
            ? cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
            : 0;
          setItemCount(totalItems);
        } catch {
          setItemCount(0);
        }
      } else {
        setItemCount(0);
      }
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
        <Link to="/" className="text-3xl font-extrabold text-indigo-600 tracking-wide hover:text-indigo-700 transition">
          Seller Panel
        </Link>

        <nav className="hidden md:flex items-center space-x-10 flex-1 justify-center">
          <Link to="/seller/products" className="text-gray-700 hover:text-indigo-600 font-medium text-lg">
            Sản phẩm của tôi
          </Link>
          <Link to="/seller/orders" className="text-gray-700 hover:text-indigo-600 font-medium text-lg">
            Quản lý đơn hàng
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <Link to="/cart" className="relative text-gray-700 hover:text-indigo-600 transition-transform hover:scale-110">
            <ShoppingCart className="h-7 w-7" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>

          {userName && (
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-semibold flex items-center gap-2 text-lg">
                <User className="h-6 w-6 text-indigo-600" />
                {userName}
              </span>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition">
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;
