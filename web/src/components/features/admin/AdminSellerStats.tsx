import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { adminAPI } from "../../../services/api";

interface SellerRevenue {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  totalRevenue: number;
  totalOrders: number;
  year?: number;
  month?: number;
}

const AdminSellerStats: React.FC = () => {
  const [revenues, setRevenues] = useState<SellerRevenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>("");

  const fetchRevenue = async () => {
  setLoading(true);
  try {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (year && month) {
      startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
      endDate = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();
    } else if (year) {
      startDate = new Date(Number(year), 0, 1).toISOString();
      endDate = new Date(Number(year), 11, 31, 23, 59, 59).toISOString();
    }

    const res = await adminAPI.getSellerRevenue({ startDate, endDate });

    // Chỉ lấy res.data.data vì đã đúng type
    setRevenues(res.data.data || []);
  } catch (error) {
    console.error("Fetch seller revenue error:", error);
    setRevenues([]);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchRevenue();
  }, [year, month]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Thống kê doanh thu theo Seller</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <label>
          Năm:
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          />
        </label>
        <label>
          Tháng:
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value="">Tất cả</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={fetchRevenue}
          className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
        >
          Lọc
        </button>
      </div>

      {/* Biểu đồ */}
      <div className="bg-white shadow-md border border-gray-200 rounded-xl p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Biểu đồ doanh thu</h2>
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : revenues.length === 0 ? (
          <div>Chưa có dữ liệu.</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={revenues}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sellerName" />
              <YAxis />
              <Tooltip
                formatter={(value: any) =>
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value)
                }
              />
              <Legend />
              <Bar dataKey="totalRevenue" name="Doanh thu (VND)" fill="#8884d8" />
              <Bar dataKey="totalOrders" name="Số đơn hàng" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bảng chi tiết */}
      <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">#</th>
              <th className="p-3 border">Seller</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Doanh thu (VND)</th>
              <th className="p-3 border">Số đơn hàng</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center p-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : revenues.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4">
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              revenues.map((r, idx) => (
                <tr key={r.sellerId} className="hover:bg-gray-50">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">{r.sellerName}</td>
                  <td className="p-2 border">{r.sellerEmail}</td>
                  <td className="p-2 border">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(r.totalRevenue)}
                  </td>
                  <td className="p-2 border">{r.totalOrders}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSellerStats;
