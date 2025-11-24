import React from "react";
import { NavLink } from "react-router-dom";

const LinkItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `block px-4 py-2 rounded-lg hover:bg-gray-100 ${isActive ? "bg-gray-100 font-semibold" : ""}`}
  >
    {children}
  </NavLink>
);

const SellerSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Seller Center</h2>
        <p className="text-sm text-gray-500 mt-1">Quản lý cửa hàng</p>
      </div>

      <nav className="p-4 space-y-1">
        <LinkItem to="/seller/dashboard">Dashboard</LinkItem>
        <LinkItem to="/seller/products">Sản phẩm</LinkItem>
        <LinkItem to="/seller/products/create">Tạo sản phẩm</LinkItem>
        <LinkItem to="/seller/orders">Đơn hàng</LinkItem>
      </nav>
    </aside>
  );
};

export default SellerSidebar;
