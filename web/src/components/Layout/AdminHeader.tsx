import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  LogOut,
  Shield,
  MessageSquareWarning,
  Tag,
  Store,
  BarChart3,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { logout } from "../../store/slices/authSlice";

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    { name: "Thống kê", path: "/admin/stats", icon: <BarChart3 size={18} /> },
    { name: "Khiếu nại", path: "/admin/support", icon: <MessageSquareWarning size={18} /> },
    { name: "Khuyến mãi", path: "/admin/promotions", icon: <Tag size={18} /> },
    { name: "Quản lý Shop", path: "/admin/shops", icon: <Store size={18} /> },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">

          {/* LOGO */}
          <Link
            to="/admin"
            className="flex items-center gap-3 text-2xl font-black text-indigo-700"
          >
            <Shield className="w-7 h-7" />
            Admin<span className="text-indigo-400 font-light">Panel</span>
          </Link>

          {/* NAV */}
          <nav className="hidden xl:flex items-center gap-4">
            {navItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition
                    ${
                      active
                        ? "bg-indigo-100 text-indigo-700 shadow"
                        : "text-gray-500 hover:text-indigo-600 hover:bg-gray-100"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* USER */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold">{user.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600"
              >
                <LogOut />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;