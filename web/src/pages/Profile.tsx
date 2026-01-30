import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  LogOut, 
  Camera, 
  Truck, 
  ShieldCheck, 
  Headphones,
  Edit2
} from "lucide-react";

// --- CONFIG ---
const API_BASE = "http://localhost:5000/api";
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

interface FormData {
  name: string;
  phone: string;
  address: string;
  email?: string; // Thêm email để hiển thị (thường là read-only)
}

interface Notification {
  type: "success" | "error";
  message: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({ name: "", phone: "", address: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notif, setNotif] = useState<Notification | null>(null);

  // --- FETCH DATA ---
  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
      setFormData({
        name: res.data.user.name || "",
        phone: res.data.user.phone || "",
        address: res.data.user.address || "",
        email: res.data.user.email || "",
      });
    } catch (err) {
      console.error(err);
      setNotif({ type: "error", message: "Không thể tải thông tin" });
      // Nếu lỗi auth thì đá về login
      if (axios.isAxiosError(err) && err.response?.status === 401) {
          navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [navigate]);

  // --- HANDLERS ---
  const handleSave = async () => {
    // Validation cơ bản
    if (!/^\d{9,15}$/.test(formData.phone)) {
      setNotif({ type: "error", message: "Số điện thoại không hợp lệ (9-15 số)" });
      return;
    }

    try {
      setUpdating(true);
      // Chỉ gửi name, phone, address (không gửi email vì email thường không đổi)
      const updatePayload = {
          name: formData.name,
          phone: formData.phone,
          address: formData.address
      };
      
      const res = await api.put("/auth/profile", updatePayload);
      setUser(res.data.user);
      setEditing(false);
      setNotif({ type: "success", message: "Cập nhật thông tin thành công!" });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      setNotif({ type: "error", message: msg });
    } finally {
      setUpdating(false);
      setTimeout(() => setNotif(null), 3000);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      email: user.email || "",
    });
    setEditing(false);
    setNotif(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
      localStorage.clear();
      navigate('/login');
  }

  // --- RENDER ---
  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900"></div>
      </div>
  );

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div className="max-w-7xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-black text-stone-900 mb-2">Hồ Sơ Của Tôi</h1>
        <p className="text-stone-500">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- LEFT SIDEBAR (MENU) --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center gap-4">
                {/* Avatar Mini */}
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-lg">
                    {formData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-xs text-stone-500 font-bold uppercase">Xin chào,</p>
                    <p className="font-bold text-stone-900 truncate max-w-[120px]">{formData.name}</p>
                </div>
            </div>
            <nav className="p-4 space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 text-amber-900 font-bold rounded-lg transition-colors border-l-4 border-amber-600">
                    <User size={18} /> Thông tin cá nhân
                </button>
                <button 
                    onClick={() => navigate('/orders')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium rounded-lg transition-colors"
                >
                    <ShoppingBag size={18} /> Đơn hàng của tôi
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium rounded-lg transition-colors">
                    <MapPin size={18} /> Sổ địa chỉ
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium rounded-lg transition-colors">
                    <CreditCard size={18} /> Phương thức thanh toán
                </button>
                <div className="h-px bg-stone-100 my-2"></div>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 font-medium rounded-lg transition-colors"
                >
                    <LogOut size={18} /> Đăng xuất
                </button>
            </nav>
          </div>
        </div>

        {/* --- RIGHT CONTENT (FORM) --- */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
            
            {/* Header Form */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-100">
                <h2 className="text-xl font-bold text-stone-800">Chỉnh sửa hồ sơ</h2>
                {!editing && (
                    <button 
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-full transition-all"
                    >
                        <Edit2 size={16} /> Chỉnh sửa
                    </button>
                )}
            </div>

            {/* Notification */}
            {notif && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm font-medium ${
                notif.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {notif.type === "success" ? <ShieldCheck size={18}/> : <LogOut size={18} className="rotate-180"/>}
                {notif.message}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-10">
                {/* 1. Avatar Section */}
                <div className="flex flex-col items-center justify-start md:w-1/3 pt-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 rounded-full bg-stone-200 flex items-center justify-center text-4xl font-black text-stone-400 border-4 border-white shadow-lg overflow-hidden">
                            {/* Nếu có ảnh thì hiện img, ko thì hiện chữ cái đầu */}
                            {user?.avatar ? (
                                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span>{formData.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        {/* Edit Overlay */}
                        <div className="absolute bottom-0 right-0 bg-stone-900 text-white p-2 rounded-full shadow-md border-2 border-white hover:bg-amber-600 transition-colors">
                            <Camera size={16} />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-stone-500 text-center">
                        Dung lượng file tối đa 1 MB<br/>Định dạng: .JPEG, .PNG
                    </p>
                </div>

                {/* 2. Form Fields */}
                <div className="flex-1 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Họ và Tên</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full p-3 rounded-lg border bg-stone-50 text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all ${!editing ? 'opacity-70 cursor-not-allowed border-transparent' : 'border-stone-200 bg-white'}`}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Số điện thoại</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={!editing}
                                className={`w-full p-3 rounded-lg border bg-stone-50 text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all ${!editing ? 'opacity-70 cursor-not-allowed border-transparent' : 'border-stone-200 bg-white'}`}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Email <span className="text-stone-300 font-normal normal-case">(Không thể thay đổi)</span></label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full p-3 rounded-lg border border-transparent bg-stone-100 text-stone-500 font-medium cursor-not-allowed"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Địa chỉ giao hàng</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                disabled={!editing}
                                placeholder="Nhập địa chỉ nhận hàng..."
                                className={`w-full p-3 rounded-lg border bg-stone-50 text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all ${!editing ? 'opacity-70 cursor-not-allowed border-transparent' : 'border-stone-200 bg-white'}`}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {editing && (
                        <div className="flex items-center gap-4 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={updating}
                                className="px-8 py-3 bg-amber-900 text-white font-bold rounded-lg shadow-md hover:bg-amber-800 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updating ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={updating}
                                className="px-6 py-3 bg-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-300 transition-all"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- BOTTOM INFO BLOCKS (Giống ảnh mẫu) --- */}
      <div className="max-w-7xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Truck size={24} />
            </div>
            <div>
                <h4 className="font-bold text-stone-800">Miễn phí vận chuyển</h4>
                <p className="text-sm text-stone-500">Cho đơn hàng trên 500k</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <CreditCard size={24} />
            </div>
            <div>
                <h4 className="font-bold text-stone-800">Thanh toán linh hoạt</h4>
                <p className="text-sm text-stone-500">Nhiều phương thức bảo mật</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Headphones size={24} />
            </div>
            <div>
                <h4 className="font-bold text-stone-800">Hỗ trợ 24/7</h4>
                <p className="text-sm text-stone-500">Luôn sẵn sàng hỗ trợ bạn</p>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;