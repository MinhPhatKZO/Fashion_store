import React, { useEffect, useState } from "react";
import axios from "axios";
import { DollarSign, Package, TrendingUp, ShoppingBag, Truck, Calendar, Home, BarChart3, User, Loader2 } from "lucide-react";
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

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ===========================================
// ⭐ INTERFACES
// ===========================================
interface Order {
    _id: string;
    orderNumber: string;
    totalPrice: number;
    status: string;
    createdAt: string;
}

interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
}

// ===========================================
// ⭐ UTILS
// ===========================================
const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

// ===========================================
// ⭐ STATUS CARD COMPONENT (Đã sửa lỗi TypeScript)
// ===========================================
const StatusCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string }> = ({ 
    icon: IconComponent, 
    title, 
    value, 
    color 
}) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-center transition-all duration-300 hover:shadow-xl">
        <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
            <IconComponent className={`w-6 h-6 ${color}`} /> 
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
        </div>
    </div>
);


// ===========================================
// ⭐ MAIN COMPONENT
// ===========================================
export default function SellerDashboard() {
    const [userName, setUserName] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [revenueToday, setRevenueToday] = useState<number>(0);
    const [revenueWeek, setRevenueWeek] = useState<number>(0);
    const [revenueMonth, setRevenueMonth] = useState<number>(0);
    const [weekRevenue, setWeekRevenue] = useState<number[]>([]);
    const [monthRevenue, setMonthRevenue] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUserName(localStorage.getItem("userName"));

        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const res = await axios.get(`${API}/seller/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = res.data;

                setProducts(data.products || []);
                setOrders(data.orders || []);
                setRevenueToday(data.revenueToday || 0);
                setRevenueWeek(data.revenueWeek || 0);
                setRevenueMonth(data.revenueMonth || 0);
                setWeekRevenue(data.weekRevenue || []);
                setMonthRevenue(data.monthRevenue || []);
            } catch (err) {
                console.error("Error fetching seller dashboard data:", err);
                // alert("Lỗi tải dữ liệu. Vui lòng đăng nhập lại."); // Comment để tránh alert liên tục
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ================== CHART DATA ==================
    const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const monthLabels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);

    const weekChartData = {
        labels: weekDays,
        datasets: [
            {
                label: "Doanh thu tuần (VND)",
                data: weekRevenue,
                fill: true,
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderColor: "rgb(59, 130, 246)",
                pointBackgroundColor: "rgb(59, 130, 246)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgb(59, 130, 246)",
                tension: 0.4,
            },
        ],
    };

    const monthChartData = {
        labels: monthLabels,
        datasets: [
            {
                label: "Doanh thu tháng (VND)",
                data: monthRevenue,
                fill: true,
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                borderColor: "rgb(34, 197, 94)",
                pointBackgroundColor: "rgb(34, 197, 94)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgb(34, 197, 94)",
                tension: 0.4,
            },
        ],
    };
    
    // ================== HELPER FUNCTIONS ==================
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>;
            case "processing":
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Đang xử lý</span>;
            case "shipped":
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang giao</span>;
            case "cancelled":
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Đã hủy</span>;
            default:
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <Loader2 className="animate-spin w-10 h-10 text-indigo-600" />
                <p className="ml-3 text-gray-600">Đang tải Dashboard...</p>
            </div>
        );
    }


    // ================== RENDER ==================
    return (
        <div className="min-h-screen bg-gray-100 p-6 sm:p-8 lg:p-10">
            
            <main className="flex-1">
                {/* Header chào mừng */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">👋 Xin chào, {userName || "Quản trị viên"}!</h1>
                    <p className="text-gray-500 mt-1">Tổng quan hiệu suất bán hàng của bạn.</p>
                </div>

                {/* ================== CARDS DOANH THU ================== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatusCard 
                        icon={DollarSign} 
                        title="Doanh thu hôm nay" 
                        value={formatCurrency(revenueToday)} 
                        color="text-green-600"
                    />
                    <StatusCard 
                        icon={TrendingUp} 
                        title="Doanh thu tuần" 
                        value={formatCurrency(revenueWeek)} 
                        color="text-blue-600"
                    />
                    <StatusCard 
                        icon={Calendar} 
                        title="Doanh thu tháng" 
                        value={formatCurrency(revenueMonth)} 
                        color="text-indigo-600"
                    />
                    <StatusCard 
                        icon={Truck} 
                        title="Tổng đơn hàng" 
                        value={orders.length} 
                        color="text-yellow-600"
                    />
                    <StatusCard 
                        icon={Package} 
                        title="Tổng sản phẩm" 
                        value={products.length} 
                        color="text-pink-600"
                    />
                </div>

                {/* ================== BIỂU ĐỒ ================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" /> Doanh thu theo tuần
                        </h2>
                        <Line data={weekChartData} />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" /> Doanh thu theo tháng
                        </h2>
                        <Line data={monthChartData} />
                    </div>
                </div>

                {/* ================== ĐƠN HÀNG GẦN ĐÂY ================== */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-yellow-600" /> 10 Đơn hàng gần đây
                    </h2>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Order #</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Tổng tiền</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Trạng thái</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-600">Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 10).map((o) => (
                                    <tr key={o._id} className="border-b hover:bg-indigo-50/50 transition">
                                        <td className="px-4 py-3 font-medium text-gray-900">{o.orderNumber}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(o.totalPrice)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(o.status)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-gray-500 italic">
                                            Không có đơn hàng nào gần đây.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}