import React from "react";

const SellerOrders: React.FC = () => {
  const orders = [
    { customer: "Nguyễn Văn A", total: 350000, status: "Chờ xác nhận" },
    { customer: "Trần Thị B", total: 220000, status: "Đã xác nhận" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Quản lý đơn hàng</h1>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">#</th>
            <th className="p-2 border">Khách hàng</th>
            <th className="p-2 border">Tổng tiền</th>
            <th className="p-2 border">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => (
            <tr key={idx} className="hover:bg-gray-50 text-center">
              <td className="p-2 border">{idx + 1}</td>
              <td className="p-2 border">{o.customer}</td>
              <td className="p-2 border">{o.total.toLocaleString()} VND</td>
              <td className="p-2 border">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerOrders;
