import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

interface FormData {
  name: string;
  phone: string;
  address: string;
}

interface Notification {
  type: "success" | "error";
  message: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notif, setNotif] = useState<Notification | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
      setFormData({
        name: res.data.user.name || "",
        phone: res.data.user.phone || "",
        address: res.data.user.address || "",
      });
    } catch (err) {
      console.error(err);
      setNotif({ type: "error", message: "Không thể tải thông tin" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 🔹 Frontend validation số điện thoại
    if (!/^\d{9,15}$/.test(formData.phone)) {
      setNotif({ type: "error", message: "Số điện thoại phải gồm 9-15 chữ số" });
      return;
    }

    try {
      setUpdating(true);
      const res = await api.put("/auth/profile", formData);
      setUser(res.data.user);
      setEditing(false);
      setNotif({ type: "success", message: "Cập nhật thông tin thành công!" });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      setNotif({ type: "error", message: msg });
    } finally {
      setUpdating(false);
      setTimeout(() => setNotif(null), 3000);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
    });
    setEditing(false);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) return <p className="p-6">Đang tải thông tin...</p>;

  return (
    <div className="max-w-2xl mx-auto p-8 mt-6 mb-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-6">Thông tin tài khoản</h1>

      {notif && (
        <div
          className={`mb-4 p-3 rounded ${
            notif.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {notif.message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Họ và tên"
          value={formData.name}
          onChange={handleChange}
          disabled={!editing}
          className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="phone"
          placeholder="Số điện thoại"
          value={formData.phone}
          onChange={handleChange}
          disabled={!editing}
          className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="address"
          placeholder="Địa chỉ"
          value={formData.address}
          onChange={handleChange}
          disabled={!editing}
          className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="mt-6 flex gap-3">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Sửa
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={updating}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              {updating ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition"
            >
              Hủy
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
