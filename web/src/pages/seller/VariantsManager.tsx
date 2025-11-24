import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Edit, Trash, Save, X } from "lucide-react";

type Variant = {
  _id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  comparePrice?: number;
  stock: number;
};

type Props = {
  productId: string;
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const VariantsManager: React.FC<Props> = ({ productId }) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Variant>>({});

  // Fetch variants
  const fetchVariants = async () => {
    try {
      const res = await api.get(`/seller/products/${productId}/variants`);
      setVariants(res.data.data || []);
    } catch (err) {
      console.error("Lỗi lấy variants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  // Handle add/update variant
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        const res = await api.put(
          `/seller/products/${productId}/variants/${editingId}`,
          form
        );
        setVariants((prev) =>
          prev.map((v) => (v._id === editingId ? res.data.variant : v))
        );
        setEditingId(null);
      } else {
        // Create
        const res = await api.post(
          `/seller/products/${productId}/variants`,
          form
        );
        setVariants((prev) => [...prev, res.data.variant]);
      }
      setForm({});
    } catch (err) {
      console.error("Lỗi thêm/sửa variant", err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa biến thể này?")) return;
    try {
      await api.delete(`/seller/products/${productId}/variants/${id}`);
      setVariants((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      console.error("Lỗi xóa variant", err);
    }
  };

  // Start editing
  const startEdit = (variant: Variant) => {
    setEditingId(variant._id);
    setForm({ ...variant });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-6">
      <h2 className="text-xl font-bold mb-4">Quản lý biến thể</h2>

      {/* Form add/edit */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-3 mb-4">
        <input
          type="text"
          placeholder="SKU"
          required
          value={form.sku || ""}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          className="border rounded p-2 col-span-1"
        />
        <input
          type="text"
          placeholder="Size"
          required
          value={form.size || ""}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
          className="border rounded p-2 col-span-1"
        />
        <input
          type="text"
          placeholder="Color"
          required
          value={form.color || ""}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          className="border rounded p-2 col-span-1"
        />
        <input
          type="number"
          placeholder="Price"
          required
          value={form.price || ""}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          className="border rounded p-2 col-span-1"
        />
        <input
          type="number"
          placeholder="Compare Price"
          value={form.comparePrice || ""}
          onChange={(e) => setForm({ ...form, comparePrice: Number(e.target.value) })}
          className="border rounded p-2 col-span-1"
        />
        <input
          type="number"
          placeholder="Stock"
          required
          value={form.stock || ""}
          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
          className="border rounded p-2 col-span-1"
        />
        <div className="flex items-center gap-2 col-span-full">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-1"
          >
            <Save className="w-4 h-4" /> {editingId ? "Lưu" : "Thêm biến thể"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm({}); }}
              className="bg-gray-300 px-4 py-2 rounded flex items-center gap-1 hover:bg-gray-400"
            >
              <X className="w-4 h-4" /> Hủy
            </button>
          )}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="text-center py-6">Đang tải biến thể...</div>
      ) : variants.length === 0 ? (
        <div className="text-gray-500 text-center py-6">Chưa có biến thể nào</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {variants.map((v) => (
            <div key={v._id} className="border rounded p-3 flex flex-col gap-2">
              <div><b>SKU:</b> {v.sku}</div>
              <div><b>Size:</b> {v.size}</div>
              <div><b>Color:</b> {v.color}</div>
              <div><b>Price:</b> {v.price.toLocaleString()} đ</div>
              {v.comparePrice && <div><b>Compare:</b> {v.comparePrice.toLocaleString()} đ</div>}
              <div><b>Stock:</b> {v.stock}</div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => startEdit(v)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(v._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1"
                >
                  <Trash className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VariantsManager;
