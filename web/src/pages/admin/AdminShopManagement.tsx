import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { 
  Store, Package, Search, Eye, Ban, CheckCircle, 
  AlertOctagon, TrendingUp, Star, FileText, X, 
  AlertTriangle, Trash2, Mail, UserPlus, ShieldCheck, XCircle
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";
const socket = io(API_BASE_URL);

export default function AdminShopManagement() {
  const [activeTab, setActiveTab] = useState<"requests" | "shops" | "products">("shops");
  const [sellers, setSellers] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [sellerRequests, setSellerRequests] = useState<any[]>([]); // ← mới
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Modals
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ""});
  const [reason, setReason] = useState("");

  // === TOAST ===
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    const toast = document.createElement("div");
    toast.innerText = msg;
    toast.className = `fixed bottom-10 right-10 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm z-[9999] animate-bounce ${
      type === "success" ? "bg-emerald-500" : "bg-rose-500"
    }`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // === FETCH DATA ===
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [sellerRes, productRes, requestRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/sellers`, { headers }),
        axios.get(`${API_BASE_URL}/api/admin/sellers/products/pending`, { headers }),
        axios.get(`${API_BASE_URL}/api/admin/sellers/requests/pending`, { headers }) // ← mới
      ]);
      
      setSellers(sellerRes.data);
      setPendingProducts(productRes.data);
      setSellerRequests(requestRes.data); // ← mới
    } catch (err: any) {
      showToast(err.response?.data?.message || "Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    socket.on("update_admin_counts", () => {
      fetchData();
    });

    return () => {
      socket.off("update_admin_counts");
    };
  }, [fetchData]);

  // === NEW: XỬ LÝ ĐƠN ĐĂNG KÝ SELLER ===
  const handleRequestAction = async (id: string, status: "approved" | "rejected") => {
    const confirmMsg = status === "approved" 
      ? "Cấp quyền Seller cho người dùng này?" 
      : "Từ chối đơn đăng ký này?";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/admin/sellers/requests/${id}/approve`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(status === "approved" ? "Đã nâng cấp thành Seller" : "Đã từ chối đơn đăng ký");
      fetchData();
    } catch (err) {
      showToast("Xử lý đơn thất bại", "error");
    }
  };

  // === SELLER ACTIONS (giữ nguyên code cũ) ===
  const handleUpdateStrikes = async (id: string, currentStrikes: number, amount: number) => {
    const newStrikes = Math.max(0, (currentStrikes || 0) + amount);
    const confirmMsg = amount > 0 ? "Phạt thêm 1 gậy vi phạm?" : "Gỡ bỏ 1 gậy cho Seller?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/admin/sellers/${id}/status`, 
        { strikes: newStrikes }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(amount > 0 ? "Đã gửi cảnh cáo" : "Đã gỡ gậy thành công");
      setSelectedShop(null);
      fetchData();
    } catch (err) { showToast("Thao tác thất bại", "error"); }
  };

  const toggleShopStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/admin/sellers/${id}/status`, 
        { isActive: !currentStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(!currentStatus ? "Đã mở khóa Shop" : "Đã tạm dừng Shop");
      fetchData();
    } catch (err) { showToast("Lỗi cập nhật", "error"); }
  };

  // === PRODUCT ACTIONS (giữ nguyên) ===
  const handleProductDecision = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reason) {
      showToast("Vui lòng nhập lý do từ chối", "error");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/admin/sellers/products/${id}/approve`, 
        { status, reason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(status === 'approved' ? "Sản phẩm đã lên sàn" : "Đã từ chối sản phẩm");
      setRejectModal({isOpen: false, id: ""});
      setReason("");
      fetchData();
    } catch (err) { showToast("Lỗi phê duyệt", "error"); }
  };

  const filteredSellers = sellers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      
      {/* HEADER & TABS - đã mở rộng thêm tab Requests */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
            <Store className="text-indigo-600" />
            Hệ thống Quản lý Seller
          </h1>
          <p className="text-slate-500 font-medium">Kiểm duyệt cửa hàng, sản phẩm & đơn đăng ký</p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveTab("requests")}
            className={`relative px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === "requests" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"
            }`}
          >
            <UserPlus size={18} />
            Đơn đăng ký
            {sellerRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                {sellerRequests.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("shops")}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === "shops" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"}`}
          >
            Quản lý Shop
          </button>

          <button 
            onClick={() => setActiveTab("products")}
            className={`relative px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === "products" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-indigo-600"}`}
          >
            Duyệt sản phẩm
            {pendingProducts.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                {pendingProducts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mb-8 max-w-xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          placeholder="Tìm kiếm theo tên hoặc email..."
          className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">

        {/* TAB ĐƠN ĐĂNG KÝ (mới) */}
        {activeTab === "requests" && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerRequests.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold">
                Không có đơn đăng ký nào đang chờ duyệt
              </div>
            ) : (
              sellerRequests.map(req => (
                <div key={req._id} className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 font-bold text-xl">
                      {req.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRequestAction(req._id, "approved")}
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleRequestAction(req._id, "rejected")}
                        className="p-3 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{req.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{req.email}</p>
                  <div className="text-xs space-y-1">
                    <div><strong>Mã số thuế:</strong> {req.taxCode || "Chưa cung cấp"}</div>
                    {req.businessLicense && (
                      <div>
                        <strong>Giấy phép: </strong>
                        <a href={`${API_BASE_URL}/${req.businessLicense}`} target="_blank" className="text-indigo-600 hover:underline">
                          Xem file
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB SHOPS - giữ nguyên code cũ */}
        {activeTab === "shops" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[11px] font-bold tracking-widest border-b">
                <tr>
                  <th className="p-6">Thông tin Shop</th>
                  <th className="p-6 text-center">Doanh thu</th>
                  <th className="p-6 text-center">Tỷ lệ hoàn</th>
                  <th className="p-6 text-center">Vi phạm</th>
                  <th className="p-6">Trạng thái</th>
                  <th className="p-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSellers.map((seller) => (
                  <tr key={seller._id} className="hover:bg-slate-50/50 transition-all group">
                    {/* ... giữ nguyên toàn bộ phần tbody của tab shops từ code cũ ... */}
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                          {seller.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{seller.name}</div>
                          <div className="text-xs text-slate-400 font-medium">{seller.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="font-bold text-emerald-600 flex items-center justify-center gap-1">
                        <TrendingUp size={14} />
                        {seller.stats?.totalRevenue?.toLocaleString()}đ
                      </div>
                    </td>
                    <td className="p-6 text-center font-bold text-slate-500">
                      {seller.stats?.returnRate}%
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black ${seller.strikes > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                        {seller.strikes || 0} Strikes
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase ${seller.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {seller.isActive ? "Đang chạy" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setSelectedShop(seller)} className="p-2.5 bg-white text-blue-600 rounded-xl shadow-sm border hover:bg-blue-600 hover:text-white">
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => toggleShopStatus(seller._id, seller.isActive)}
                          className={`p-2.5 bg-white rounded-xl shadow-sm border transition-all ${seller.isActive ? 'text-rose-500 hover:bg-rose-500 hover:text-white' : 'text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                        >
                          {seller.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB PRODUCTS - giữ nguyên code cũ */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
            {pendingProducts.length > 0 ? pendingProducts.map(p => (
              <div key={p._id} className="bg-slate-50 rounded-[24px] p-5 border border-slate-100 hover:shadow-lg transition-all group">
                <div className="aspect-square bg-white rounded-2xl mb-4 overflow-hidden border">
                  <img 
                    src={p.images && p.images.length > 0 ? `${API_BASE_URL}/${p.images[0]}` : "https://via.placeholder.com/150"} 
                    alt={p.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                  />
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-1">{p.name}</h3>
                <div className="text-xs text-slate-400 font-bold mb-4">Shop: {p.seller?.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleProductDecision(p._id, 'approved')} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-[11px] shadow-lg shadow-indigo-100 active:scale-95 transition-all">Duyệt Đăng</button>
                  <button onClick={() => setRejectModal({isOpen: true, id: p._id})} className="p-2.5 bg-white text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-50"><Trash2 size={16} /></button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold">🎉 Không còn sản phẩm nào cần duyệt!</div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CHI TIẾT SELLER */}
      {selectedShop && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedShop(null)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Thông tin chi tiết Shop</h2>
              <button onClick={() => setSelectedShop(null)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            <div className="p-8">
               <div className="flex gap-6 mb-8">
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">🏬</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{selectedShop.name}</h3>
                    <p className="text-slate-500 text-sm font-medium">{selectedShop.email}</p>
                    <div className="flex gap-4 mt-3">
                       <div className="flex items-center gap-1 text-amber-500 font-bold text-xs"><Star size={12} fill="currentColor" /> 4.8</div>
                       <div className="flex items-center gap-1 text-slate-400 font-bold text-xs"><Package size={12} /> {selectedShop.stats?.productCount} Sản phẩm</div>
                    </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giấy phép kinh doanh</p>
                     {selectedShop.businessLicense ? (
                       <a href={`${API_BASE_URL}/${selectedShop.businessLicense}`} target="_blank" className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"><FileText size={16}/> Xem file thật</a>
                     ) : ( <span className="text-slate-400 text-xs italic">Chưa nộp file</span> )}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mã số thuế</p>
                     <p className="font-black text-slate-800">{selectedShop.taxCode || "Chưa cung cấp"}</p>
                  </div>
               </div>

               <div className="p-6 bg-rose-50 rounded-[24px] border border-rose-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <AlertOctagon size={18} /> Quản lý Strikes: {selectedShop.strikes || 0}/3
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateStrikes(selectedShop._id, selectedShop.strikes, 1)}
                      className="flex-[2] py-3 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={16} /> PHẠT 1 GẬY
                    </button>
                    {selectedShop.strikes > 0 && (
                      <button 
                        onClick={() => handleUpdateStrikes(selectedShop._id, selectedShop.strikes, -1)}
                        className="flex-1 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl font-bold text-xs"
                      >
                        GỠ GẬY
                      </button>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL TỪ CHỐI SẢN PHẨM - giữ nguyên */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRejectModal({isOpen: false, id: ""})}></div>
          <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Lý do từ chối sản phẩm?</h3>
            <textarea 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none h-32 font-bold text-sm"
              placeholder="Ví dụ: Hình ảnh mờ, sai danh mục, giá quá cao..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleProductDecision(rejectModal.id, 'rejected')} className="flex-1 bg-rose-600 text-white py-3.5 rounded-xl font-bold text-sm">Gửi & Từ chối</button>
              <button onClick={() => setRejectModal({isOpen: false, id: ""})} className="px-6 py-3.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}