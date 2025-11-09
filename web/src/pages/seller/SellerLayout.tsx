import React from "react";
import { Link, Outlet } from "react-router-dom";

const SellerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-xl font-semibold mb-6">Seller Panel</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/seller/dashboard" className="py-2 px-3 rounded hover:bg-gray-100">
            Dashboard
          </Link>
          <Link to="/seller/products" className="py-2 px-3 rounded hover:bg-gray-100">
            Quản lý sản phẩm
          </Link>
          <Link to="/seller/orders" className="py-2 px-3 rounded hover:bg-gray-100">
            Đơn hàng
          </Link>
          <Link to="/seller/profile" className="py-2 px-3 rounded hover:bg-gray-100">
            Thông tin cá nhân
          </Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;
