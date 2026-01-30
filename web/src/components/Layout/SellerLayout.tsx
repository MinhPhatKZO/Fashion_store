import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PlusCircle,
  LogOut,
  User,
  Store,
  ChevronRight,
  Loader2,
  MessageCircle,
  Video // 1. Import icon Video
} from "lucide-react";

// --- CONFIG ---
const API_BASE_URL = "http://localhost:5000";

const getImageUrl = (url: string | undefined) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/assets")) return url;
  return `${API_BASE_URL}${url}`;
};

// --- 2. Thêm item "Livestream" vào NAV_ITEMS ---
const NAV_ITEMS = [
  { label: "Tổng quan", path: "/seller", icon: LayoutDashboard, exact: true },
  { label: "Sản phẩm", path: "/seller/products", icon: Package, exact: true },
  { label: "Thêm sản phẩm", path: "/seller/products/create", icon: PlusCircle, exact: true },
  { label: "Đơn hàng", path: "/seller/orders", icon: ShoppingCart, exact: false },
  { label: "Tin nhắn", path: "/seller/chat", icon: MessageCircle, exact: true },
  { label: "Livestream", path: "/seller/livestream", icon: Video, exact: true } // <-- MỚI
];

const SellerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sellerInfo, setSellerInfo] = useState<{
    name: string;
    email: string;
    brandName?: string;
    brandLogo?: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { user, brand } = res.data;

        if (user.role !== 'seller') {
          alert("Tài khoản này không có quyền truy cập trang quản lý bán hàng.");
          navigate("/");
          return;
        }

        setSellerInfo({
          name: user.name,
          email: user.email,
          brandName: brand?.name || "Chưa có Brand",
          brandLogo: brand?.logoUrl
        });
      } catch (err) {
        console.error("Lỗi xác thực:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    setSellerInfo(null);
    navigate("/login");
  };

  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl fixed inset-y-0 left-0 z-50 transition-all duration-300">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <Link to="/seller" className="flex items-center gap-3 group w-full">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1 flex-shrink-0 group-hover:scale-105 transition-transform">
              {sellerInfo?.brandLogo ? (
                <img src={getImageUrl(sellerInfo.brandLogo)} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Store className="h-6 w-6 text-slate-800" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-bold tracking-tight text-white truncate group-hover:text-blue-400 transition-colors">
                {sellerInfo?.brandName}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Kênh Người Bán
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Quản lý cửa hàng
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group mb-1
                  ${active 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-medium" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-500 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="h-4 w-4 text-blue-200" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
               {sellerInfo?.name?.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{sellerInfo?.name}</p>
               <p className="text-xs text-slate-500 truncate">{sellerInfo?.email}</p>
             </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-red-400 bg-slate-900 border border-slate-800 hover:bg-red-950/30 hover:border-red-900/50 rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-72 flex flex-col min-w-0 transition-all duration-300">
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm/50 backdrop-blur-md bg-white/90">
          <div className="flex items-center text-sm font-medium text-gray-500">
            <span className="text-gray-900">Dashboard</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="capitalize text-blue-600 font-semibold">
                {location.pathname === "/seller" ? "Tổng quan" : location.pathname.split("/").pop()}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{sellerInfo?.name}</p>
                <p className="text-xs text-gray-500 mt-1">Chủ cửa hàng</p>
              </div>
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 text-gray-600">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;