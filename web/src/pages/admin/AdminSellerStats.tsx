import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { 
  DollarSign, ShoppingBag, Users, RefreshCw, Eye, X, Calendar, 
  BarChart3
} from "lucide-react";

// Cấu hình URL (Thay đổi nếu Port của bạn khác)
const API_BASE_URL = "http://localhost:5000";
const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

const AdminSellerStats: React.FC = () => {
  // --- States cho dữ liệu tổng quan ---
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(false);

  // --- States cho bộ lọc ---
  const [year, setYear] = useState("2025"); // Mặc định 2025 theo data của bạn
  const [month, setMonth] = useState("");

  // --- States cho Modal chi tiết ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Hàm helper tính toán ngày bắt đầu và kết thúc để gửi lên BE
  const getFilterDates = () => {
    let startDate = "";
    let endDate = "";
    if (year) {
      if (month) {
        startDate = `${year}-${month.padStart(2, '0')}-01T00:00:00.000Z`;
        // Lấy ngày cuối cùng của tháng
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        endDate = `${year}-${month.padStart(2, '0')}-${lastDay}T23:59:59.999Z`;
      } else {
        startDate = `${year}-01-01T00:00:00.000Z`;
        endDate = `${year}-12-31T23:59:59.999Z`;
      }
    }
    return { startDate, endDate };
  };

  // 1. Fetch dữ liệu tổng quan cho biểu đồ và bảng chính
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { startDate, endDate } = getFilterDates();

      const res = await axios.get(`${API_BASE_URL}/api/admin/stats/seller-revenue`, {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(res.data.data || []);
      setSummary(res.data.summary || { totalRevenue: 0, totalOrders: 0 });
    } catch (err) {
      console.error("Lỗi fetch dữ liệu tổng quan:", err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // 2. Fetch chi tiết đơn hàng khi nhấn nút "Chi tiết"
  const handleViewDetail = async (seller: any) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
    setLoadingDetail(true);
    try {
      const token = localStorage.getItem("token");
      const { startDate, endDate } = getFilterDates();

      const res = await axios.get(`${API_BASE_URL}/api/admin/stats/seller-details/${seller.sellerId}`, {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSellerOrders(res.data.orders || []);
    } catch (err) {
      console.error("Lỗi fetch chi tiết đơn hàng:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 
            className="text-3xl font-bold flex items-center gap-2 text-gray-800">
              <BarChart3 className="text-indigo-600" />
              Tổng quan doanh thu
          </h1>
          <p className="text-slate-500">Thống kê hiệu quả kinh doanh của các Seller</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:flex gap-4 mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Năm báo cáo</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 w-full md:w-32 font-bold"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tháng</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold min-w-[160px]"
          >
            <option value="">Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Tổng doanh thu" value={summary.totalRevenue} icon={<DollarSign />} color="indigo" isMoney />
        <StatCard title="Tổng đơn hàng" value={summary.totalOrders} icon={<ShoppingBag />} color="orange" />
        <StatCard title="Tổng số Seller" value={data.length} icon={<Users />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CHART */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Biểu đồ doanh thu theo Seller
          </h3>
          <div className="h-[350px] w-full">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="sellerName" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                    formatter={(val: any) => [new Intl.NumberFormat('vi-VN').format(val) + " ₫", "Doanh thu"]}
                  />
                  <Bar dataKey="totalRevenue" radius={[8, 8, 0, 0]} barSize={40}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">Không có dữ liệu hiển thị</div>
            )}
          </div>
        </div>

        {/* TOP LIST / TABLE */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">Xếp hạng Seller</h3>
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={item.sellerId} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="text-xl font-black text-slate-300 group-hover:text-indigo-500 transition-colors">0{index + 1}</div>
                  <div>
                    <div className="font-bold text-slate-700">{item.sellerName}</div>
                    <div className="text-xs text-slate-400">{item.totalOrders} đơn hàng</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleViewDetail(item)}
                  className="p-2 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shadow-sm"
                >
                  <Eye size={20} />
                </button>
              </div>
            ))}
            {data.length === 0 && <div className="text-center py-10 text-slate-400">Trống</div>}
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Chi tiết đơn hàng</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                    {selectedSeller?.sellerName}
                  </span>
                  <span className="text-slate-400 text-sm italic">
                    — {month ? `Tháng ${month}/` : "Năm "}{year}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="bg-slate-100 text-slate-500 p-3 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium">Đang truy xuất dữ liệu đơn hàng...</p>
                </div>
              ) : sellerOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-slate-400 text-[11px] uppercase font-black tracking-widest">
                        <th className="px-4 pb-2">Mã vận đơn</th>
                        <th className="px-4 pb-2">Thời gian</th>
                        <th className="px-4 pb-2">Khách hàng</th>
                        <th className="px-4 pb-2">Trạng thái</th>
                        <th className="px-4 pb-2 text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.map((order: any) => (
                        <tr key={order._id} className="bg-slate-50 hover:bg-slate-100 transition-colors group">
                          <td className="p-4 rounded-l-2xl font-mono text-indigo-600 font-bold tracking-tighter">
                            #{order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="p-4 text-slate-600 text-sm">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800 text-sm">{order.user?.name || "N/A"}</div>
                            <div className="text-[10px] text-slate-400">{order.user?.email || "No email"}</div>
                          </td>
                          <td className="p-4 text-xs">
                            <span className={`px-3 py-1 rounded-lg font-bold uppercase tracking-tighter ${getStatusStyle(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 rounded-r-2xl text-right font-black text-slate-800">
                            {order.totalPrice.toLocaleString()} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 font-medium">Không có dữ liệu đơn hàng trong kỳ này</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-slate-50/50 flex justify-between items-center">
               <div className="text-sm text-slate-500 font-medium">
                  Hiển thị <span className="text-slate-900 font-bold">{sellerOrders.length}</span> đơn hàng
               </div>
               <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
               >
                 Đóng cửa sổ
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components & Helpers ---

function StatCard({ title, value, icon, color, isMoney }: any) {
  const themes: any = {
    indigo: "bg-indigo-600 shadow-indigo-100",
    orange: "bg-orange-500 shadow-orange-100",
    emerald: "bg-emerald-500 shadow-emerald-100",
  };
  return (
    <div className={`p-6 rounded-3xl text-white ${themes[color]} shadow-2xl relative overflow-hidden group`}>
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
        {React.cloneElement(icon, { size: 120 })}
      </div>
      <div className="relative z-10">
        <p className="text-white/70 text-[11px] font-black uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black">
          {isMoney ? new Intl.NumberFormat('vi-VN').format(value) : value.toLocaleString()}
          {isMoney && <span className="text-lg ml-1 opacity-80">₫</span>}
        </h3>
      </div>
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'delivered': case 'completed': return 'bg-emerald-100 text-emerald-600';
    case 'pending': return 'bg-amber-100 text-amber-600';
    case 'shipped': return 'bg-blue-100 text-blue-600';
    case 'cancelled': return 'bg-red-100 text-red-600';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export default AdminSellerStats;