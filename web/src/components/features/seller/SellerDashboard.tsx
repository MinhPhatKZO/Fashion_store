import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star, MessageSquare, TrendingUp, Package, DollarSign, ShoppingBag } from "lucide-react"; 
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
} from "chart.js";

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
  const [userName, setUserName] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [revenueToday, setRevenueToday] = useState<number>(0);
  const [revenueWeek, setRevenueWeek] = useState<number>(0);
  const [revenueMonth, setRevenueMonth] = useState<number>(0);
  const [weekRevenue, setWeekRevenue] = useState<number[]>([]);
  const [monthRevenue, setMonthRevenue] = useState<number[]>([]);

  useEffect(() => {
    setUserName(localStorage.getItem("userName"));
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchData = async () => {
      try {
        const dashboardRes = await axios.get(`${API_BASE_URL}/api/seller/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = dashboardRes.data;

        setOrders(data.orders || []);
        setRevenueToday(data.revenueToday || 0);
        setRevenueWeek(data.revenueWeek || 0);
        setRevenueMonth(data.revenueMonth || 0);
        setWeekRevenue(data.weekRevenue || []);
        setMonthRevenue(data.monthRevenue || []);

        const reviewsRes = await axios.get(`${API_BASE_URL}/api/reviews/seller`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setReviews(reviewsRes.data || []);

      } catch (err) {
        console.error("Error fetching seller data:", err);
      }
    };

    fetchData();
  }, []);

  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const monthLabels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: function(value: any) { return value.toLocaleString('vi-VN') + 'đ'; } }
      }
    }
  };

  const weekChartData = {
    labels: weekDays,
    datasets: [{
        label: "Doanh thu tuần (VND)",
        data: weekRevenue,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgb(59, 130, 246)",
        tension: 0.4,
    }],
  };

  const monthChartData = {
    labels: monthLabels,
    datasets: [{
        label: "Doanh thu tháng (VND)",
        data: monthRevenue,
        fill: true,
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "rgb(34, 197, 94)",
        tension: 0.4,
    }],
  };

  const renderStars = (rating: number) => {
    return (
        <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={14} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? "text-yellow-400" : "text-gray-300"} />
            ))}
        </div>
    );
  };

  // ⭐⭐⭐ HÀM XỬ LÝ ẢNH (FIX LỖI) ⭐⭐⭐
  const getProductImage = (img: any) => {
      if (!img) return "https://via.placeholder.com/150?text=No+Image";
      
      let imgUrl = typeof img === "string" ? img : img?.url;
      if (!imgUrl) return "https://via.placeholder.com/150?text=No+Image";

      // Nếu là link online
      if (imgUrl.startsWith("http")) return imgUrl;

      // Xử lý link local (xóa dấu \ của windows và / ở đầu)
      imgUrl = imgUrl.replace(/\\/g, "/");
      if (imgUrl.startsWith("/")) imgUrl = imgUrl.substring(1);

      return `${API_BASE_URL}/${imgUrl}`;
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Tổng quan</h1>
                <p className="text-gray-500 text-sm">Chào mừng trở lại, {userName || "Shop"}</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
        </div>

        {/* Cards Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Doanh thu hôm nay</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{(revenueToday || 0).toLocaleString()} ₫</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={20} /></div>
            </div>
            <div className="text-xs text-green-600 flex items-center gap-1 font-medium"><TrendingUp size={12} /> Cập nhật realtime</div>
          </div>
          {/* Card 2 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
             <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Doanh thu tuần</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{(revenueWeek || 0).toLocaleString()} ₫</h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><TrendingUp size={20} /></div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
             <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Doanh thu tháng</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{(revenueMonth || 0).toLocaleString()} ₫</h3>
                </div>
                <div className="p-2 bg-green-50 rounded-lg text-green-600"><ShoppingBag size={20} /></div>
            </div>
          </div>
          {/* Card 4 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
             <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Tổng đơn hàng</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{orders?.length || 0}</h3>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Package size={20} /></div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-gray-800 font-bold mb-6">Biểu đồ tuần</h2>
            <div className="h-80 w-full"><Line data={weekChartData} options={chartOptions} /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-gray-800 font-bold mb-6">Biểu đồ tháng</h2>
            <div className="h-80 w-full"><Line data={monthChartData} options={chartOptions} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-gray-800 font-bold">Đơn hàng mới nhất</h2>
                    <button className="text-sm text-blue-600 hover:underline">Xem tất cả</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="p-3 font-medium rounded-l-lg">Mã đơn</th>
                            <th className="p-3 font-medium">Tổng tiền</th>
                            <th className="p-3 font-medium">Trạng thái</th>
                            <th className="p-3 font-medium rounded-r-lg">Ngày đặt</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                        {orders && orders.length > 0 ? (
                            orders.slice(0, 5).map((o) => (
                            <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 font-medium text-blue-600">#{o.orderNumber}</td>
                                <td className="p-3 font-bold text-gray-700">{(o.totalPrice || 0).toLocaleString()} ₫</td>
                                <td className="p-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${o.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 
                                        o.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-gray-50 text-gray-600 border-gray-100'}
                                    `}>
                                        {o.status}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-500">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Chưa có đơn hàng nào</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Đánh giá khách hàng */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-gray-800 font-bold mb-6 flex items-center gap-2">
                    <MessageSquare size={20} className="text-purple-500"/> Đánh giá mới nhất
                </h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {reviews && reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review._id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm">
                                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    {/* ⭐⭐⭐ ẢNH CÓ FALLBACK KHI LỖI ⭐⭐⭐ */}
                                    <img 
                                        src={getProductImage(review.product?.images?.[0])} 
                                        alt="prod" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                                        }}
                                    />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1 font-medium truncate w-40 sm:w-52">
                                                {review.product?.name || "Sản phẩm đã xóa"}
                                            </p>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                    {(review.user?.name || "U").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-gray-800 truncate">{review.user?.name || "Khách hàng"}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded">
                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-2">
                                        {renderStars(review.rating)}
                                    </div>

                                    <div className="relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 rounded-full"></div>
                                        <p className="text-sm text-gray-600 pl-3 italic line-clamp-2">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                             <MessageSquare size={40} className="mb-2 opacity-20"/>
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