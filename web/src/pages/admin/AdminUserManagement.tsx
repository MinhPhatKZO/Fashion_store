import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "seller" | "admin";
  phone?: string;
  address?: string;
  createdAt: string;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "seller">("user");

  const fetchUsers = async (role: "user" | "seller") => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers(role);

      const usersData = Array.isArray(res.data) ? res.data : [];
      setUsers(usersData);
    } catch (error) {
      console.error("❌ Fetch users error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(selectedRole);
  }, [selectedRole]);

  const handleUpdateRole = async (id: string, newRole: "user" | "seller") => {
    try {
      await adminAPI.updateUserRole(id, newRole);

      // Update UI
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );

      alert("Cập nhật vai trò thành công!");
    } catch (error) {
      console.error("❌ Update role error:", error);
      alert("Không thể cập nhật role.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Quản lý tài khoản
      </h1>

      {/* Tab User/Seller */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedRole("user")}
          className={`px-6 py-3 font-semibold transition-all ${
            selectedRole === "user"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          User
        </button>
        <button
          onClick={() => setSelectedRole("seller")}
          className={`px-6 py-3 font-semibold transition-all ${
            selectedRole === "seller"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Seller
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            Đang tải dữ liệu...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Chưa có dữ liệu cho role này.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, idx) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {idx + 1}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || "N/A"}
                  </td>

                  {/* ⬇⬇⬇ BỔ SUNG DROPDOWN ĐỔI ROLE ⬇⬇⬇ */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleUpdateRole(
                          user._id,
                          e.target.value as "user" | "seller"
                        )
                      }
                      className="border border-gray-300 px-3 py-1 rounded-lg text-sm bg-white"
                    >
                      <option value="user">User</option>
                      <option value="seller">Seller</option>
                    </select>
                  </td>
                  {/* ⬆⬆⬆ BỔ SUNG DROPDOWN ĐỔI ROLE ⬆⬆⬆ */}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!loading && users.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Tổng số {selectedRole === "user" ? "người dùng" : "sellers"}:{" "}
          {users.length}
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
