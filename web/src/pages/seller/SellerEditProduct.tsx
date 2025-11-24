import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import VariantsManager from "./VariantsManager";
import { Plus, X } from "lucide-react";

type ImageItem = { url: string; isPrimary?: boolean };

type Product = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brandId?: string;
  categoryId?: string;
  images: ImageItem[];
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const SellerEditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ImageItem[]>([]);

  const [form, setForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    brandId: "",
    categoryId: "",
  });

  // Lấy thông tin sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/seller/products/${id}`);
        setProduct(res.data);
        setForm({
          name: res.data.name,
          price: res.data.price,
          stock: res.data.stock,
          brandId: res.data.brandId || "",
          categoryId: res.data.categoryId || "",
        });
        setImages(res.data.images || []);
      } catch (err) {
        console.error("Lỗi lấy sản phẩm", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Handle submit form update product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/seller/products/${id}`, { ...form, images });
      alert("Cập nhật sản phẩm thành công!");
      navigate("/seller/products");
    } catch (err) {
      console.error("Lỗi cập nhật sản phẩm", err);
      alert("Lỗi cập nhật sản phẩm");
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      isPrimary: false,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === index }))
    );
  };

  if (loading) return <div className="p-6">Đang tải sản phẩm...</div>;
  if (!product) return <div className="p-6 text-red-500">Sản phẩm không tồn tại</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sửa sản phẩm</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Tên sản phẩm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Giá"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Số lượng kho"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Thương hiệu"
            value={form.brandId}
            onChange={(e) => setForm({ ...form, brandId: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Danh mục"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="border p-2 rounded"
          />
        </div>

        {/* Quản lý hình ảnh */}
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 w-max">
            <Plus className="w-4 h-4" /> Thêm ảnh
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative border rounded overflow-hidden">
                <img src={img.url} alt={`Ảnh ${idx}`} className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(idx)}
                    className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
                  >
                    Set Primary
                  </button>
                )}
                {img.isPrimary && (
                  <span className="absolute bottom-1 left-1 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="col-span-full flex justify-end mt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Cập nhật sản phẩm
          </button>
        </div>
      </form>

      {/* Variants */}
      <VariantsManager productId={product._id} />
    </div>
  );
};

export default SellerEditProduct;
