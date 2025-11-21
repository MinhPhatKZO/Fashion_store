import React, { useState, useEffect } from "react";
import { sellerAPI } from "../../services/api";

interface SellerRevenue {
  year?: number;
  month?: number;
  totalRevenue: number;
  totalOrders: number;
}

const SellerDashboard: React.FC = () => {
  const [revenues, setRevenues] = useState<SellerRevenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>("");

  const fetchRevenue = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: { startDate?: string; endDate?: string } = {};

      if (month) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        params.startDate = startDate.toISOString().split("T")[0];
        params.endDate = endDate.toISOString().split("T")[0];
      } else {
        params.startDate = `${year}-01-01`;
        params.endDate = `${year}-12-31`;
      }

      const response = await sellerAPI.getRevenue(params);
      const revenueData = response.data?.data; // <-- Lấy đúng object từ ApiResponse

      setRevenues([
        {
          totalRevenue: revenueData?.totalRevenue || 0,
          totalOrders: revenueData?.totalOrders || 0,
          year: parseInt(year),
          month: month ? parseInt(month) : undefined,
        },
      ]);
    } catch (err) {
      console.error("Error fetching seller revenue:", err);
      setError("Không thể tải dữ liệu doanh thu. Vui lòng thử lại.");
      setRevenues([
        {
          totalRevenue: 0,
          totalOrders: 0,
          year: parseInt(year),
          month: month ? parseInt(month) : undefined,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Báo cáo doanh thu</h1>

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
            className="border rounded px-2 py-1 appearance-none"
            style={{ backgroundImage: "none" }}
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
          disabled={loading}
        >
          {loading ? "Đang lọc..." : "Lọc"}
        </button>
      </div>

      {/* Lỗi */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Bảng */}
      <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">#</th>
              <th className="p-3 border">Doanh thu (VND)</th>
              <th className="p-3 border">Số đơn hàng</th>
              {month && <th className="p-3 border">Tháng</th>}
              {!month && <th className="p-3 border">Năm</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={month ? 4 : 3} className="text-center p-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : (
              revenues.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(r.totalRevenue)}
                  </td>
                  <td className="p-2 border">{r.totalOrders}</td>
                  {month && <td className="p-2 border">{r.month}</td>}
                  {!month && <td className="p-2 border">{r.year}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerDashboard;
