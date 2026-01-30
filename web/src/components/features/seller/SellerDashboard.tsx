import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Star,
  MessageSquare,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingBag,
  Calendar,
  User
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from "chart.js";

// Đăng ký các thành phần cho Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- CONFIG ---
const API_BASE_URL = "http://localhost:5000";

// --- INTERFACES ---
interface Order {
  _id: string;
  orderNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface Review {
  _id: string;
  user: {
    name: string;
    avatar?: string;
    email: string;
  };
  product: {
    name: string;
    images: any[];
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function SellerDashboard() {
  const [userName, setUserName] = useState<string | null>("Shop");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    revenueToday: 0,
    revenueWeek: 0,
    revenueMonth: 0,
    weekRevenue: [] as number[],
    monthRevenue: [] as number[],
  });
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    setIsLoading(false);
    return;
  }

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [dashboardRes, reviewsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/seller/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/reviews/seller`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const data = dashboardRes.data;
      const revenue = data.revenue || {};

      setOrders(data.orders || []);

      // ✅ FIX QUAN TRỌNG
      setStats({
        revenueToday: revenue.today || 0,
        revenueWeek: revenue.week || 0,
        revenueMonth: revenue.month || 0,
        weekRevenue: revenue.chartWeek || Array(7).fill(0),
        monthRevenue: revenue.chartMonth || Array(12).fill(0),
      });

      setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error("Error fetching seller data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);


  // --- CHART CONFIG (ĐÃ FIX LỖI TYPE NULL) ---
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          // ✅ FIX: Thêm ( || 0 ) để xử lý trường hợp null
          label: (context) => ` ${(context.parsed.y || 0).toLocaleString('vi-VN')} ₫`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f3f4f6' },
        ticks: { 
            // ✅ FIX: Ép kiểu an toàn trước khi format
            callback: (value) => (typeof value === 'number' ? value : Number(value)).toLocaleString('vi-VN') + ' đ',
            font: { size: 10 },
            maxTicksLimit: 6 
        }
      }
    },
    interaction: {
        mode: 'index',
        intersect: false,
    },
  };

  const weekLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const monthLabels = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

  const weekChartData = {
    labels: weekLabels,
    datasets: [{
      label: "Doanh thu tuần",
      data: stats.weekRevenue,
      fill: true,
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
        return gradient;
      },
      borderColor: "#3b82f6",
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  };

  const monthChartData = {
    labels: monthLabels,
    datasets: [{
      label: "Doanh thu năm",
      data: stats.monthRevenue,
      fill: true,
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
        gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
        return gradient;
      },
      borderColor: "#10b981",
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
    }],
  };

  // --- HELPERS ---
  const getProductImage = (img: any) => {
    if (!img) return "https://via.placeholder.com/150?text=No+Image";
    const imgUrl = typeof img === "string" ? img : img?.url;
    if (!imgUrl) return "https://via.placeholder.com/150?text=No+Image";
    
    if (imgUrl.startsWith("http")) return imgUrl;
    return `${API_BASE_URL}/${imgUrl.replace(/\\/g, "/").replace(/^\//, "")}`;
  };

  const renderStars = (rating: number) => (
    <div className="flex text-yellow-400 gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          size={12} 
          fill={star <= rating ? "currentColor" : "none"} 
          className={star <= rating ? "text-yellow-400" : "text-gray-300"} 
        />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'paid': // Thêm case này nếu cần
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">Hoàn thành</span>;
      case 'pending':
      case 'pending_payment':
      case 'waiting_approval':
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Đang xử lý</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100">{status}</span>;
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium text-sm">Đang tải dữ liệu...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="text-blue-600" size={28} />
                    Tổng quan bán hàng
                </h1>
                <p className="text-gray-500 text-sm mt-1">Xin chào, <span className="font-semibold text-gray-700">{userName}</span>! Chúc bạn một ngày tốt lành.</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                <Calendar size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                    {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Doanh thu hôm nay" 
            value={stats.revenueToday} 
            icon={<DollarSign size={24} />} 
            color="bg-blue-500"
            subText="Real-time"
          />
          <StatCard 
            title="Doanh thu tuần" 
            value={stats.revenueWeek} 
            icon={<TrendingUp size={24} />} 
            color="bg-indigo-500"
            subText="So với tuần trước"
          />
          <StatCard 
            title="Doanh thu tháng" 
            value={stats.revenueMonth} 
            icon={<ShoppingBag size={24} />} 
            color="bg-emerald-500"
            subText="Tổng tích lũy"
          />
          <StatCard 
            title="Tổng đơn hàng" 
            value={orders.length} 
            icon={<Package size={24} />} 
            color="bg-orange-500"
            isCurrency={false}
            subText="Tất cả thời gian"
          />
        </div>

        {/* --- CHARTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
            <h2 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                Biểu đồ tuần này
            </h2>
            <div className="h-[300px] w-full">
                <Line data={weekChartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
            <h2 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Biểu đồ năm nay
            </h2>
            <div className="h-[300px] w-full">
                <Line data={monthChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* --- BOTTOM SECTION --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* RECENT ORDERS */}
            <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Đơn hàng mới nhất</h2>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                        Xem tất cả
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 font-semibold">Mã đơn</th>
                                <th className="p-4 font-semibold">Tổng tiền</th>
                                <th className="p-4 font-semibold">Trạng thái</th>
                                <th className="p-4 font-semibold">Ngày đặt</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                        {orders && orders.length > 0 ? (
                            orders.slice(0, 6).map((o, idx) => (
                            <tr key={o._id} className={`group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0`}>
                                <td className="p-4 font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                    #{o.orderNumber}
                                </td>
                                <td className="p-4 font-bold text-gray-800">
                                    {o.totalPrice.toLocaleString()} ₫
                                </td>
                                <td className="p-4">
                                    {getStatusBadge(o.status)}
                                </td>
                                <td className="p-4 text-gray-500">
                                    {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-400">Chưa có đơn hàng nào</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECENT REVIEWS */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col h-[600px] xl:h-auto">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <MessageSquare size={20} className="text-purple-500"/> 
                    Đánh giá gần đây
                </h2>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {reviews && reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review._id} className="group p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-md hover:bg-blue-50/10 transition-all duration-200">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-blue-200 transition-colors">
                                        <img 
                                            src={getProductImage(review.product?.images?.[0])} 
                                            alt="product" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=IMG"; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-gray-800 truncate pr-2">
                                                {review.user?.name || "Khách ẩn danh"}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <div className="mb-1">{renderStars(review.rating)}</div>
                                        <p className="text-xs text-gray-500 line-clamp-2 italic">
                                            "{review.comment}"
                                        </p>
                                        <p className="text-[10px] text-blue-500 mt-2 font-medium truncate">
                                            SP: {review.product?.name || "Sản phẩm đã xóa"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                             <MessageSquare size={48} className="mb-3 opacity-10"/>
                             <p>Chưa có đánh giá nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---
const StatCard = ({ title, value, icon, color, isCurrency = true, subText }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">
                    {isCurrency ? value.toLocaleString() + ' ₫' : value}
                </h3>
            </div>
            <div className={`p-3 ${color} rounded-xl text-white shadow-lg shadow-${color}/30`}>
                {icon}
            </div>
        </div>
        {subText && (
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-green-600">{subText}</span>
            </div>
        )}
    </div>
);