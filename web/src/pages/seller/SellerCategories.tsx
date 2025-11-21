import React from "react";

const SellerCategories: React.FC = () => {
  const categories = [
    { name: "Áo quần", brand: "Fahasa" },
    { name: "Giày dép", brand: "Nike" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Danh mục & Thương hiệu</h1>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">#</th>
            <th className="p-2 border">Tên danh mục</th>
            <th className="p-2 border">Thương hiệu</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c, idx) => (
            <tr key={idx} className="hover:bg-gray-50 text-center">
              <td className="p-2 border">{idx + 1}</td>
              <td className="p-2 border">{c.name}</td>
              <td className="p-2 border">{c.brand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerCategories;
