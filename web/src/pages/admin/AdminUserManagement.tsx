import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "seller" | "admin";
  phone?: string;
  isActive?: boolean;
  createdAt: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"all" | "user" | "seller">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  // Hiệu ứng cuộn lên đầu trang khi chuyển trang
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentPage]);

  // ===== TOAST =====
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    const toast = document.createElement("div");
    toast.innerText = msg;
    toast.className = `fixed bottom-5 right-5 px-4 py-2 rounded-lg shadow-lg text-white text-sm z-50 ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    } animate-bounce`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // ===== FETCH USERS =====
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (err) {
      showToast("Lỗi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ===== FILTER + SEARCH LOGIC =====
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const keyword = search.toLowerCase();
      const matchSearch =
        u.name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword);
      
      const matchRole = selectedRole === "all" ? true : u.role === selectedRole;
      
      let matchStatus = true;
      if (statusFilter === "active") matchStatus = u.isActive === true;
      if (statusFilter === "blocked") matchStatus = u.isActive === false;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, selectedRole, statusFilter]);

  // ===== PAGINATION LOGIC =====
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRole, statusFilter]);

  // ===== API ACTIONS =====
  const updateRole = async (id: string, role: "user" | "seller") => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/admin/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
      showToast("Cập nhật vai trò thành công");
    } catch (err) {
      showToast("Lỗi cập nhật", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (id: string, current?: boolean) => {
    try {
      setActionLoading(id);
      const token = localStorage.getItem("token");
      const newStatus = !(current ?? true);
      await axios.put(`${API_BASE_URL}/api/admin/users/${id}/status`, { isActive: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: newStatus } : u)));
      showToast(newStatus ? "Đã mở tài khoản" : "Đã khóa tài khoản");
    } catch (err) {
      showToast("Lỗi cập nhật trạng thái", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
          <Users className="text-indigo-600" />
          Quản lý tài khoản
        </h1>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 p-1 bg-white border rounded-2xl shadow-sm">
          {["all", "user", "seller"].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role as any)}
              className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                selectedRole === role ? "bg-indigo-600 text-white shadow-md" : "bg-transparent text-gray-500 hover:bg-gray-50"
              }`}
            >
              {role.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="Tìm tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Đang lấy dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
                <tr>
                  <th className="p-5 text-left font-bold">Người dùng</th>
                  <th className="p-5 text-left font-bold">Email</th>
                  <th className="p-5 text-center font-bold">Vai trò</th>
                  
                  {/* CỘT TRẠNG THÁI CÓ LỌC */}
                  <th className="p-5 text-center font-bold">
                    <div className="flex items-center justify-center gap-1 relative group cursor-pointer">
                      <span>Trạng thái</span>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      >
                        <option value="all">Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="blocked">Bị khóa</option>
                      </select>
                      <ChevronDown size={14} className={`transition-transform ${statusFilter !== 'all' ? 'text-indigo-600 scale-125' : ''}`} />
                    </div>
                  </th>

                  <th className="p-5 text-center font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-5 font-semibold text-gray-800">{u.name}</td>
                    <td className="p-5 text-gray-500">{u.email}</td>
                    <td className="p-5 text-center">
                      <select
                        value={u.role}
                        disabled={actionLoading === u._id}
                        onChange={(e) => updateRole(u._id, e.target.value as any)}
                        className="border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="user">User</option>
                        <option value="seller">Seller</option>
                      </select>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {u.isActive ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => toggleStatus(u._id, u.isActive)}
                        disabled={actionLoading === u._id}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 justify-center mx-auto transition-all active:scale-95 ${
                          u.isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-100"
                        }`}
                      >
                        {actionLoading === u._id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.isActive ? "Khóa" : "Mở"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-5 py-2.5 border rounded-xl bg-white font-medium hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
          >
            Trang trước
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                  currentPage === i + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-600 border"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-5 py-2.5 border rounded-xl bg-white font-medium hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}