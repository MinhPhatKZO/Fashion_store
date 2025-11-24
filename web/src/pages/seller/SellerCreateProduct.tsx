import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const token = localStorage.getItem("token");

const SellerCreateProduct: React.FC = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price.toString());
      formData.append("description", description);
      if (image) formData.append("image", image);

      const res = await api.post("/seller/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const id = res.data.product?._id ?? res.data._id;
      navigate(`/seller/products/edit/${id}`);
    } catch (err: any) {
      console.error(err.response?.data || err);
      alert("Tạo sản phẩm thất bại");
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Tạo sản phẩm mới</h1>

      <form onSubmit={handleCreate} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium">Tên sản phẩm</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium">Giá</label>
          <input type="number" value={price as any} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border rounded p-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium">Mô tả</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded p-2" rows={5} />
        </div>

        <div>
          <label className="block text-sm font-medium">Ảnh sản phẩm</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Tạo</button>
          <button type="button" onClick={() => navigate("/seller/products")} className="bg-gray-200 px-4 py-2 rounded">Huỷ</button>
        </div>
      </form>
    </div>
  );
};

export default SellerCreateProduct;
