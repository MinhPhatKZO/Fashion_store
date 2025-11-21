import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, LogOut } from "lucide-react";

const SellerHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setUserName(localStorage.getItem("userName"));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-20 px-8 flex items-center justify-between">
        <Link
          to="/seller"
          className="text-3xl font-extrabold text-indigo-600 tracking-wide hover:text-indigo-700 transition"
        >
          Fashion Store
        </Link>

        {/* NAVIGATION */}
        <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center">
          <Link
            to="/seller/products"
            className={`text-lg font-medium transition ${
              isActive("/seller/products") ? "text-indigo-600 font-bold" : "text-gray-700 hover:text-indigo-600"
            }`}
          >
            Sản phẩm
          </Link>
          <Link
            to="/seller/orders"
            className={`text-lg font-medium transition ${
              isActive("/seller/orders") ? "text-indigo-600 font-bold" : "text-gray-700 hover:text-indigo-600"
            }`}
          >
            Đơn hàng
          </Link>
          <Link
            to="/seller/categories"
            className={`text-lg font-medium transition ${
              isActive("/seller/categories") ? "text-indigo-600 font-bold" : "text-gray-700 hover:text-indigo-600"
            }`}
          >
            Danh mục & Thương hiệu
          </Link>
          <Link
            to="/seller/content"
            className={`text-lg font-medium transition ${
              isActive("/seller/content") ? "text-indigo-600 font-bold" : "text-gray-700 hover:text-indigo-600"
            }`}
          >
            Nội dung
          </Link>
          <Link
            to="/seller/promotions"
            className={`text-lg font-medium transition ${
              isActive("/seller/promotions") ? "text-indigo-600 font-bold" : "text-gray-700 hover:text-indigo-600"
            }`}
          >
            Khuyến mãi
          </Link>
        </nav>

        {/* USER INFO */}
        {userName && (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-semibold flex items-center gap-2 text-lg">
              <User className="h-6 w-6 text-indigo-600" />
              {userName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 transition"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default SellerHeader;
