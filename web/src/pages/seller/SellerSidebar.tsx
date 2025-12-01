import React from "react";
import { NavLink } from "react-router-dom";
import { Home, ShoppingBag, PlusCircle, Truck, BarChart3, LogOut, User } from "lucide-react";

// ===========================================
// ⭐ LINK ITEM COMPONENT
// ===========================================
const LinkItem: React.FC<{ to: string; children: React.ReactNode; icon: React.ElementType }> = ({ to, children, icon: IconComponent }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 p-3 rounded-xl transition duration-200
      ${isActive 
        ? "bg-indigo-700 text-white shadow-md font-semibold" 
        : "text-indigo-200 hover:bg-indigo-700 hover:text-white"
      }
    `}
    // Sử dụng 'end' để chỉ active khi đúng /seller/dashboard
    end={to === "/seller/dashboard"} 
  >
    <IconComponent className="w-5 h-5" />
    <span className="text-sm">{children}</span>
  </NavLink>
);

// ===========================================
// ⭐ SELLER SIDEBAR COMPONENT
// ===========================================
const SellerSidebar: React.FC = () => {
    
    const userName = localStorage.getItem("userName") || "Seller Name";
    
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    return (
        <aside className="w-64 bg-indigo-800 text-white flex flex-col justify-between h-screen fixed top-0 left-0 shadow-2xl z-10">
            <div className="p-6">
                {/* Header/Logo */}
                <div className="text-2xl font-bold mb-10 flex items-center gap-2 border-b border-indigo-700 pb-4">
                    <BarChart3 className="w-6 h-6 text-indigo-300" /> Seller Center
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                    <LinkItem to="/seller/dashboard" icon={Home}>Dashboard</LinkItem>
                    <LinkItem to="/seller/products" icon={ShoppingBag}>Sản phẩm</LinkItem>
                    <LinkItem to="/seller/products/create" icon={PlusCircle}>Tạo sản phẩm mới</LinkItem>
                    <LinkItem to="/seller/orders" icon={Truck}>Đơn hàng</LinkItem>
                    
                    <div className="pt-4 border-t border-indigo-700 mt-4">
                        <LinkItem to="/seller/reports" icon={BarChart3}>Báo cáo</LinkItem>
                    </div>
                </nav>
            </div>

            {/* User & Logout */}
            <div className="p-6 border-t border-indigo-700">
                <div className="flex items-center mb-4">
                    <User className="w-5 h-5 mr-3 p-1 rounded-full bg-indigo-600" />
                    <span className="text-sm font-semibold overflow-hidden truncate">
                        {userName}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition shadow-md"
                >
                    <LogOut className="w-5 h-5" /> Đăng xuất
                </button>
            </div>
        </aside>
    );
};

export default SellerSidebar;