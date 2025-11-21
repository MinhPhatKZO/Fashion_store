import React from "react";

const SellerContent: React.FC = () => {
  const reviews = [
    { user: "Nguyễn Văn A", comment: "Sản phẩm tốt", visible: true },
    { user: "Trần Thị B", comment: "Chưa hài lòng", visible: false },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Quản lý nội dung</h1>
      <table className="min-w-full border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">#</th>
            <th className="p-2 border">Người dùng</th>
            <th className="p-2 border">Nội dung</th>
            <th className="p-2 border">Hiển thị</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r, idx) => (
            <tr key={idx} className="hover:bg-gray-50 text-center">
              <td className="p-2 border">{idx + 1}</td>
              <td className="p-2 border">{r.user}</td>
              <td className="p-2 border">{r.comment}</td>
              <td className="p-2 border">
                <input type="checkbox" checked={r.visible} readOnly />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerContent;
