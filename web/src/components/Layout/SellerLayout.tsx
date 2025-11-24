import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, PlusCircle } from "lucide-react";

const SellerLayout: React.FC = () => {
  const location = useLocation();
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
    navigate(0);
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Seller Dashboard</h2>
        <nav className="flex flex-col gap-3 flex-1">
          <Link
            to="/seller"
            className={`px-3 py-2 rounded transition ${
              isActive("/seller") && location.pathname === "/seller"
                ? "bg-indigo-600 font-bold"
                : "hover:bg-gray-700"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/seller/products"
            className={`px-3 py-2 rounded transition ${
              isActive("/seller/products") && !location.pathname.includes("/create")
                ? "bg-indigo-600 font-bold"
                : "hover:bg-gray-700"
            }`}
          >
            Products
          </Link>
          <Link
            to="/seller/products/create"
            className={`flex items-center gap-2 px-3 py-2 rounded transition font-semibold ${
              location.pathname === "/seller/products/create"
                ? "bg-indigo-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <PlusCircle className="h-5 w-5" />
            Create Product
          </Link>
          <Link
            to="/seller/orders"
            className={`px-3 py-2 rounded transition ${
              isActive("/seller/orders") ? "bg-indigo-600 font-bold" : "hover:bg-gray-700"
            }`}
          >
            Orders
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50 h-20 flex items-center px-6 justify-between">
          <Link
            to="/seller"
            className="text-3xl font-extrabold text-indigo-600 tracking-wide hover:text-indigo-700 transition"
          >
            Seller Panel
          </Link>

          <div className="flex items-center gap-6">
            {/* Cart */}
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

            {/* User Info + Logout */}
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

        {/* Page content */}
        <main className="flex-1 p-6 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
