import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Shield } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { logout } from "../../store/slices/authSlice";

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* 🔷 Logo / Brand */}
          <Link
            to="/admin"
            className="flex items-center gap-3 text-2xl md:text-3xl font-black tracking-tight text-indigo-700 hover:opacity-80 transition-opacity"
          >
            <Shield className="h-7 w-7 text-indigo-700" />
            Admin<span className="font-light text-indigo-500">Panel</span>
          </Link>

          {/* 🧭 Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {[
              { name: "Tài khoản", path: "/admin" },
              { name: "Khuyến mãi", path: "/admin/promotion" },
              { name: "Thống kê", path: "/admin/statistics" },
            ].map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="relative text-stone-600 hover:text-indigo-700 font-bold text-base transition-colors group tracking-wide py-2"
              >
                {item.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* 👤 User / Logout */}
          {user && (
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3 pl-1 pr-3 py-1 hover:bg-stone-50 rounded-full transition-all">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200">
                  <User className="h-5 w-5 text-indigo-700" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider leading-tight">
                    Admin
                  </p>
                  <p className="text-sm font-bold text-stone-900 leading-tight max-w-[120px] truncate">
                    {user.name}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                title="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
