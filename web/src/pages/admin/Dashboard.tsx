import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import { User } from "../../types";

const AdminDashboard: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<"user" | "seller">("user");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch users theo role
  const fetchUsers = async (role: "user" | "seller") => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers(role); // trả về User[]
      setUsers(res.data || []);
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsers([]);
      alert("Không thể tải danh sách users");
    } finally {
      setLoading(false);
    }
  };

  // Khi đổi role user
  const handleRoleChange = async (userId: string, newRole: "user" | "seller") => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Update role error:", error);
      alert("Không thể cập nhật role. Vui lòng thử lại.");
    }
  };

  // Xoá user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá người dùng này không?")) return;

    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      alert("Xoá người dùng thành công");
    } catch (error) {
      console.error("Delete user error:", error);
      alert("Không thể xoá người dùng. Vui lòng thử lại.");
    }
  };

  // Khi chọn role hiển thị
  useEffect(() => {
    fetchUsers(selectedRole);
  }, [selectedRole]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Quản lý tài khoản</h1>

      {/* Chọn role */}
      <div className="flex gap-4 mb-6">
        {["user", "seller"].map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role as "user" | "seller")}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedRole === role ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {role === "user" ? "User" : "Seller"}
          </button>
        ))}
      </div>

      {/* Loading / Empty / Table */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : users.length === 0 ? (
        <p>Chưa có dữ liệu cho role này.</p>
      ) : (
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Address / Store</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr key={u._id} className="text-center hover:bg-gray-50">
                <td className="p-2 border">{index + 1}</td>
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.addresses[0]?.address || "-"}</td>
                <td className="p-2 border">{u.phone || "-"}</td>
                <td className="p-2 border">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      handleRoleChange(u._id, e.target.value as "user" | "seller")
                    }
                    className="border rounded px-2 py-1 appearance-none"
                    style={{ backgroundImage: "none" }}
                  >
                    <option value="user">User</option>
                    <option value="seller">Seller</option>
                  </select>
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleDeleteUser(u._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
