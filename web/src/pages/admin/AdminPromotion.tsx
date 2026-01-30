import React, { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import { Promotion } from "../../types";


const AdminPromotion: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<Promotion>>({
    code: "",
    description: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    active: true,
  });

  // State chỉnh sửa
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion>>({});

  // Lấy danh sách khuyến mãi
  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPromotions();
      setPromotions(res.data || []);
    } catch (error) {
      console.error("Fetch promotions error:", error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Thêm khuyến mãi mới
  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminAPI.createPromotion(newPromo);
      setPromotions((prev) => [res.data, ...prev]);
      setNewPromo({ code: "", description: "", discountPercent: 0, startDate: "", endDate: "", active: true });
      alert("Thêm khuyến mãi thành công!");
    } catch (error) {
      console.error(error);
      alert("Thêm thất bại");
    }
  };

  // Bật/tắt trạng thái
  const toggleActive = async (id: string) => {
    try {
      const res = await adminAPI.togglePromotion(id);
      setPromotions((prev) =>
        prev.map((p) => (p._id === id ? res.data : p))
      );
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  // Xóa khuyến mãi
  const deletePromotion = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa khuyến mãi này?")) return;
    try {
      await adminAPI.deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Bắt đầu sửa
  const startEditing = (promo: Promotion) => {
    setEditingPromoId(promo._id);
    setEditingPromo({ ...promo });
  };

  // Lưu sửa đổi
  const saveEdit = async () => {
    if (!editingPromoId) return;
    try {
      const res = await adminAPI.updatePromotion(editingPromoId, editingPromo);
      setPromotions((prev) =>
        prev.map((p) => (p._id === editingPromoId ? res.data : p))
      );
      setEditingPromoId(null);
      setEditingPromo({});
      alert("Cập nhật thành công!");
    } catch (error) {
      console.error(error);
      alert("Cập nhật thất bại");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Quản lý khuyến mãi</h1>

      {/* Form thêm khuyến mãi */}
      <form
        onSubmit={handleAddPromotion}
        className="bg-white shadow-md border border-gray-200 rounded-xl p-6 mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">Thêm khuyến mãi mới</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Mã khuyến mãi"
            value={newPromo.code}
            onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
            className="border rounded-lg px-3 py-2 w-full"
            required
          />
          <input
            type="number"
            placeholder="Giảm (%)"
            value={newPromo.discountPercent}
            onChange={(e) =>
              setNewPromo({ ...newPromo, discountPercent: Number(e.target.value) })
            }
            className="border rounded-lg px-3 py-2 w-full"
            required
          />
          <input
            type="date"
            value={newPromo.startDate}
            onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
            className="border rounded-lg px-3 py-2 w-full"
            required
          />
          <input
            type="date"
            value={newPromo.endDate}
            onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
            className="border rounded-lg px-3 py-2 w-full"
            required
          />
          <textarea
            placeholder="Mô tả"
            value={newPromo.description}
            onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
            className="border rounded-lg px-3 py-2 col-span-2 w-full"
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium"
        >
          Thêm khuyến mãi
        </button>
      </form>

      {/* Danh sách khuyến mãi */}
      <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">#</th>
              <th className="p-3 border">Mã</th>
              <th className="p-3 border">Mô tả</th>
              <th className="p-3 border">Giảm (%)</th>
              <th className="p-3 border">Thời gian</th>
              <th className="p-3 border text-center">Trạng thái</th>
              <th className="p-3 border text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  Chưa có khuyến mãi nào.
                </td>
              </tr>
            ) : (
              promotions.map((promo, index) => (
                <tr key={promo._id} className="hover:bg-gray-50 text-center">
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border font-semibold">
                    {editingPromoId === promo._id ? (
                      <input
                        type="text"
                        value={editingPromo.code}
                        onChange={(e) =>
                          setEditingPromo({ ...editingPromo, code: e.target.value })
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      promo.code
                    )}
                  </td>
                  <td className="p-2 border text-left">
                    {editingPromoId === promo._id ? (
                      <input
                        type="text"
                        value={editingPromo.description}
                        onChange={(e) =>
                          setEditingPromo({ ...editingPromo, description: e.target.value })
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      promo.description
                    )}
                  </td>
                  <td className="p-2 border">
                    {editingPromoId === promo._id ? (
                      <input
                        type="number"
                        value={editingPromo.discountPercent}
                        onChange={(e) =>
                          setEditingPromo({ ...editingPromo, discountPercent: Number(e.target.value) })
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                    ) : (
                      promo.discountPercent
                    )}
                  </td>
                  <td className="p-2 border">
                    {editingPromoId === promo._id ? (
                      <>
                        <input
                          type="date"
                          value={editingPromo.startDate}
                          onChange={(e) =>
                            setEditingPromo({ ...editingPromo, startDate: e.target.value })
                          }
                          className="border rounded px-2 py-1 w-full mb-1"
                        />
                        <input
                          type="date"
                          value={editingPromo.endDate}
                          onChange={(e) =>
                            setEditingPromo({ ...editingPromo, endDate: e.target.value })
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      </>
                    ) : (
                      `${new Date(promo.startDate).toLocaleDateString()} - ${new Date(
                        promo.endDate
                      ).toLocaleDateString()}`
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={() => toggleActive(promo._id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        promo.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {promo.active ? "Đang hoạt động" : "Tạm tắt"}
                    </button>
                  </td>
                  <td className="p-2 border flex justify-center gap-2">
                    {editingPromoId === promo._id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingPromoId(null)}
                          className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(promo)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deletePromotion(promo._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Xóa
                        </button>

                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPromotion;
