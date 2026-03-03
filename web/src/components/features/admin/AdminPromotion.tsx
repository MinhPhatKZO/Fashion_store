import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  TicketPercent,
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Check,
  X,
  Calendar
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

// Interface dựa trên types của bạn
interface Promotion {
  _id: string;
  code: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt?: string;
}

export default function AdminPromotion() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // State cho Form Thêm/Sửa
  const [showForm, setShowForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState<Partial<Promotion>>({
    code: "",
    description: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    active: true,
  });

  // ===== TOAST NOTIFICATION =====
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    const toast = document.createElement("div");
    toast.innerText = msg;
    toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm z-[100] transition-all ${
      type === "success" ? "bg-emerald-600" : "bg-rose-600"
    } animate-bounce`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  };

  // ===== FETCH DATA =====
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/admin/promotions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromotions(res.data || []);
    } catch (err) {
      showToast("Không thể tải danh sách khuyến mãi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // ===== FILTER LOGIC =====
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [promotions, search]);

  // ===== API ACTIONS =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingPromoId) {
        // Update
        const res = await axios.put(`${API_BASE_URL}/api/admin/promotions/${editingPromoId}`, promoForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPromotions(prev => prev.map(p => p._id === editingPromoId ? res.data : p));
        showToast("Cập nhật khuyến mãi thành công");
      } else {
        // Create
        const res = await axios.post(`${API_BASE_URL}/api/admin/promotions`, promoForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPromotions([res.data, ...promotions]);
        showToast("Thêm khuyến mãi mới thành công");
      }
      resetForm();
    } catch (err) {
      showToast("Thao tác thất bại", "error");
    }
  };

  const deletePromo = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã này?")) return;
    try {
      setActionLoading(id);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/admin/promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromotions(prev => prev.filter(p => p._id !== id));
      showToast("Đã xóa khuyến mãi");
    } catch (err) {
      showToast("Lỗi khi xóa", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (promo: Promotion) => {
    try {
      setActionLoading(promo._id);
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_BASE_URL}/api/admin/promotions/${promo._id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromotions(prev => prev.map(p => p._id === promo._id ? res.data : p));
      showToast(res.data.active ? "Đã kích hoạt" : "Đã tạm dừng");
    } catch (err) {
      showToast("Lỗi cập nhật trạng thái", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (promo: Promotion) => {
    setEditingPromoId(promo._id);
    setPromoForm({
      ...promo,
      startDate: promo.startDate.split('T')[0], // Định dạng lại cho input date
      endDate: promo.endDate.split('T')[0]
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setPromoForm({ code: "", description: "", discountPercent: 0, startDate: "", endDate: "", active: true });
    setEditingPromoId(null);
    setShowForm(false);
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
            <TicketPercent className="text-indigo-600" />
            Quản lý Khuyến mãi
          </h1>
          <p className="text-slate-500">Tạo và quản lý các mã giảm giá toàn sàn</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
            showForm ? "bg-slate-200 text-slate-600" : "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700"
          }`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Đóng Form" : "Thêm mã mới"}
        </button>
      </div>

      {/* FORM THÊM/SỬA */}
      {showForm && (
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            {editingPromoId ? "Cập nhật khuyến mãi" : "Chi tiết khuyến mãi mới"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Mã giảm giá</label>
              <input
                required
                placeholder="Ví dụ: TET2026"
                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                value={promoForm.code}
                onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Phần trăm giảm (%)</label>
              <input
                required type="number" min="0" max="100"
                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                value={promoForm.discountPercent}
                onChange={(e) => setPromoForm({...promoForm, discountPercent: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Trạng thái mặc định</label>
              <select
                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                value={promoForm.active ? "true" : "false"}
                onChange={(e) => setPromoForm({...promoForm, active: e.target.value === "true"})}
              >
                <option value="true">Kích hoạt ngay</option>
                <option value="false">Tạm ẩn</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Ngày bắt đầu</label>
              <input
                required type="date"
                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                value={promoForm.startDate}
                onChange={(e) => setPromoForm({...promoForm, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Ngày kết thúc</label>
              <input
                required type="date"
                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                value={promoForm.endDate}
                onChange={(e) => setPromoForm({...promoForm, endDate: e.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Mô tả chương trình</label>
              <textarea
                rows={2}
                placeholder="Nhập nội dung hiển thị cho khách hàng..."
                className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
                value={promoForm.description}
                onChange={(e) => setPromoForm({...promoForm, description: e.target.value})}
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button type="button" onClick={resetForm} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Hủy bỏ</button>
              <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                <Check size={18} />
                {editingPromoId ? "Lưu thay đổi" : "Xác nhận thêm mã"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="relative mb-6">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          placeholder="Tìm mã hoặc nội dung khuyến mãi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[24px] shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <RefreshCw className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
            <p className="text-slate-400 font-medium">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[11px] font-black tracking-widest">
                <tr>
                  <th className="p-6">Mã & Mô tả</th>
                  <th className="p-6 text-center">Mức giảm</th>
                  <th className="p-6">Thời hạn</th>
                  <th className="p-6 text-center">Trạng thái</th>
                  <th className="p-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPromotions.map((promo) => (
                  <tr key={promo._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-6">
                      <div className="font-black text-indigo-600 text-lg tracking-tighter">{promo.code}</div>
                      <div className="text-slate-500 text-sm line-clamp-1 mt-1">{promo.description}</div>
                    </td>
                    <td className="p-6 text-center">
                      <span className="inline-block px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm">
                        -{promo.discountPercent}%
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(promo.startDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-black uppercase mt-1">Đến: {new Date(promo.endDate).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="p-6 text-center">
                      <button
                        onClick={() => toggleStatus(promo)}
                        disabled={actionLoading === promo._id}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                          promo.active 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                          : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                        }`}
                      >
                        {promo.active ? "Đang chạy" : "Tạm dừng"}
                      </button>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => startEdit(promo)}
                          className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => deletePromo(promo._id)}
                          disabled={actionLoading === promo._id}
                          className="p-3 bg-white text-rose-500 rounded-xl shadow-sm border border-slate-100 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          {actionLoading === promo._id ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPromotions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-400 italic">
                      Không tìm thấy mã khuyến mãi nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}