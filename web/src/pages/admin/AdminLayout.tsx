import React from "react";
import { Link, Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-xl font-semibold mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link to="/admin/dashboard" className="py-2 px-3 rounded hover:bg-gray-100">Dashboard</Link>
          <Link to="/admin/products" className="py-2 px-3 rounded hover:bg-gray-100">Quản lý sản phẩm</Link>
          <Link to="/admin/orders" className="py-2 px-3 rounded hover:bg-gray-100">Đơn hàng</Link>
          <Link to="/admin/users" className="py-2 px-3 rounded hover:bg-gray-100">Người dùng</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
