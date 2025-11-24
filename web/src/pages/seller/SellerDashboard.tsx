import React, { useEffect, useState } from "react";
import axios from "axios";
import { LogOut, Box } from "lucide-react";
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

export default function SellerDashboard() {
  const [userName, setUserName] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setUserName(localStorage.getItem("userName"));

    const fetchData = async () => {
      try {
        const ordersRes = await axios.get("http://localhost:5000/api/seller/orders");
        setOrders(ordersRes.data);

        const productsRes = await axios.get("http://localhost:5000/api/seller/products");
        setProducts(productsRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const today = new Date();

  // Tính doanh thu ngày, tuần, tháng
  const isSameDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toDateString() === today.toDateString();
  };

  const isSameWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Chủ nhật là 0
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };

  const isSameMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  };

  const revenueToday = orders.filter((o) => isSameDay(o.createdAt)).reduce((sum, o) => sum + o.totalPrice, 0);
  const revenueWeek = orders.filter((o) => isSameWeek(o.createdAt)).reduce((sum, o) => sum + o.totalPrice, 0);
  const revenueMonth = orders.filter((o) => isSameMonth(o.createdAt)).reduce((sum, o) => sum + o.totalPrice, 0);

  // ===== Biểu đồ doanh thu theo tuần =====
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const weekRevenue = weekDays.map((_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - today.getDay() + i);
    return orders
      .filter((o) => new Date(o.createdAt).toDateString() === day.toDateString())
      .reduce((sum, o) => sum + o.totalPrice, 0);
  });

  // ===== Biểu đồ doanh thu theo tháng =====
  const monthLabels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
  const monthRevenue = monthLabels.map((_, i) => {
    return orders
      .filter((o) => new Date(o.createdAt).getMonth() === i)
      .reduce((sum, o) => sum + o.totalPrice, 0);
  });

  const weekChartData = {
    labels: weekDays,
    datasets: [
      {
        label: "Doanh thu tuần (VND)",
        data: weekRevenue,
        fill: false,
        backgroundColor: "rgb(59, 130, 246)",
        borderColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      },
    ],
  };

  const monthChartData = {
    labels: monthLabels,
    datasets: [
      {
        label: "Doanh thu tháng (VND)",
        data: monthRevenue,
        fill: false,
        backgroundColor: "rgb(34,197,94)",
        borderColor: "rgba(34,197,94,0.5)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-gray-200">Seller Dashboard</div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-2 p-2 rounded bg-gray-200">
            <Box className="w-5 h-5" /> Dashboard
          </div>
        </nav>
        <button
          onClick={handleLogout}
          className="p-4 border-t mt-auto hover:bg-gray-200 transition flex items-center gap-2"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Chào {userName}</h1>

        {/* Cards doanh thu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-gray-600 font-semibold mb-2">Doanh thu hôm nay</h2>
            <p className="text-2xl font-bold">{revenueToday.toLocaleString()} VND</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-gray-600 font-semibold mb-2">Doanh thu tuần</h2>
            <p className="text-2xl font-bold">{revenueWeek.toLocaleString()} VND</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-gray-600 font-semibold mb-2">Doanh thu tháng</h2>
            <p className="text-2xl font-bold">{revenueMonth.toLocaleString()} VND</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-gray-600 font-semibold mb-2">Tổng đơn hàng</h2>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
        </div>

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-gray-600 font-semibold mb-4">Doanh thu theo tuần</h2>
            <Line data={weekChartData} />
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-gray-600 font-semibold mb-4">Doanh thu theo tháng</h2>
            <Line data={monthChartData} />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-gray-600 font-semibold mb-4">Đơn hàng gần đây</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">Order #</th>
                <th className="border-b p-2">Tổng tiền</th>
                <th className="border-b p-2">Trạng thái</th>
                <th className="border-b p-2">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="p-2">{o.orderNumber}</td>
                  <td className="p-2">{o.totalPrice.toLocaleString()} VND</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
