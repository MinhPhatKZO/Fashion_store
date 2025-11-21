import React from "react";

const SellerPromotions: React.FC = () => {
  const promotions = [
    { title: "Giảm 10%", description: "Cho đơn hàng từ 500k", discount: 10 },
    { title: "Mua 1 tặng 1", description: "Áo thun mùa hè", discount: 50 },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Quản lý khuyến mãi</h1>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">#</th>
            <th className="p-2 border">Tiêu đề</th>
            <th className="p-2 border">Mô tả</th>
            <th className="p-2 border">Discount</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map((p, idx) => (
            <tr key={idx} className="hover:bg-gray-50 text-center">
              <td className="p-2 border">{idx + 1}</td>
              <td className="p-2 border">{p.title}</td>
              <td className="p-2 border">{p.description}</td>
              <td className="p-2 border">{p.discount}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerPromotions;
