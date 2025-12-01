// ====================== VariantsManager.tsx ======================
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";

interface Variant {
  _id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  comparePrice?: number;
  stock: number;
}

interface Props {
  productId: string;
  productName: string; // quan trọng: required
}

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API,
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const VariantsManager: React.FC<Props> = ({ productId, productName }) => {
  const [variants, setVariants] = useState<Variant[]>([]);

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [comparePrice, setComparePrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");

  const loadVariants = async () => {
    try {
      const res = await api.get(`/seller/products/${productId}/variants`);
      setVariants(res.data.variants || []);
    } catch (err) {
      console.error("LOAD VARIANTS ERROR", err);
    }
  };

  useEffect(() => {
    loadVariants();
  }, [productId]);

  // CREATE VARIANT
  const handleCreateVariant = async () => {
    if (!size || !color || price === "" || stock === "")
      return alert("Vui lòng nhập đầy đủ thông tin.");

    const generatedSKU = `${productName}-${size}-${color}`
      .replace(/\s+/g, "-")
      .toLowerCase();

    try {
      await api.post(`/seller/products/${productId}/variants`, {
        sku: generatedSKU,
        size,
        color,
        price,
        comparePrice: comparePrice || undefined,
        stock,
      });

      setSize("");
      setColor("");
      setPrice("");
      setComparePrice("");
      setStock("");

      loadVariants();
    } catch (err) {
      console.error("CREATE VARIANT ERROR", err);
      alert("Không thể tạo biến thể!");
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!window.confirm("Bạn có chắc muốn xoá?")) return;
    try {
      await api.delete(`/seller/products/${productId}/variants/${variantId}`);
      loadVariants();
    } catch (err) {
      console.error("DELETE VARIANT ERROR", err);
      alert("Không thể xoá biến thể!");
    }
  };

  return (
    <div className="mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Quản lý biến thể</h2>

      {/* FORM */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <input className="border p-2 rounded" placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input type="number" className="border p-2 rounded" placeholder="Price" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <input type="number" className="border p-2 rounded" placeholder="Compare Price" value={comparePrice} onChange={(e) => setComparePrice(Number(e.target.value))} />
        <input type="number" className="border p-2 rounded" placeholder="Stock" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
      </div>

      <button onClick={handleCreateVariant} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 mb-6">
        <Plus size={16} /> Thêm biến thể
      </button>

      {/* LIST */}
      <h3 className="text-lg font-semibold mb-2">Danh sách biến thể</h3>

      {variants.map((v) => (
        <div key={v._id} className="border rounded p-4 mb-3 flex justify-between items-center">
          <div>
            <strong>SKU:</strong> {v.sku} |
            <strong> Size:</strong> {v.size} |
            <strong> Color:</strong> {v.color} |
            <strong> Price:</strong> {v.price} |
            {v.comparePrice && <span><strong> Compare:</strong> {v.comparePrice} |</span>}
            <strong> Stock:</strong> {v.stock}
          </div>

          <button className="text-red-600" onClick={() => handleDeleteVariant(v._id)}>
            <Trash2 size={20} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default VariantsManager;
