import React from "react";

const SellerProducts: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Trang sản phẩm của tôi</h1>
      <p className="text-gray-600 mb-6">
        Quản lý sản phẩm của bạn: Thêm, Sửa, Xóa sản phẩm và cập nhật thông tin.
      </p>

      {/* Danh sách sản phẩm */}
      <div className="bg-white shadow rounded-md p-4">
        <p className="text-gray-500">Danh sách sản phẩm sẽ hiển thị ở đây...</p>
      </div>

      {/* Thêm các widgets / cards / charts nếu cần */}
    </div>
  );
};

export default SellerProducts;
