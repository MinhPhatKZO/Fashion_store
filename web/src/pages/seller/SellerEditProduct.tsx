import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import VariantsManager from "./VariantsManager";
import { Plus, X } from "lucide-react";

type Product = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brandId?: string;
  categoryId?: string;
  images: string[]; // backend trả array string
};

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API,
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const SellerEditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    brandId: "",
    categoryId: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // ============================
  // GET PRODUCT
  // ============================
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await api.get(`/seller/products/${id}`);
        const p: Product = res.data.product;

        setProduct(p);
        setForm({
          name: p.name,
          price: p.price,
          stock: p.stock,
          brandId: p.brandId || "",
          categoryId: p.categoryId || "",
        });

        setImages(p.images ?? []);
      } catch (err) {
        console.error("GET PRODUCT ERROR", err);
        alert("Không thể tải dữ liệu sản phẩm");
      }
      setLoading(false);
    };

    loadProduct();
  }, [id]);

  // ============================
  // UPDATE PRODUCT
  // ============================
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/seller/products/${id}`, {
        ...form,
        images, // mảng string
      });

      alert("Cập nhật sản phẩm thành công!");
      navigate("/seller/products");
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      alert("Không thể cập nhật sản phẩm");
    }
  };

  // ============================
  // UPLOAD ẢNH MỚI → backend
  // ============================
  const handleUploadImages = async () => {
    if (newFiles.length === 0) return alert("Chưa chọn ảnh!");

    const fd = new FormData();
    newFiles.forEach((file) => fd.append("images", file));

    try {
      const res = await api.post(`/seller/products/${id}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImages(res.data.product.images); // cập nhật từ backend
      setNewFiles([]);
      alert("Upload ảnh thành công!");
    } catch (err) {
      console.error("UPLOAD ERROR", err);
      alert("Upload ảnh thất bại");
    }
  };

  // ============================
  // REMOVE IMAGE (chỉ xoá local)
  // ============================
  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  // ============================
  // RENDER
  // ============================
  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!product) return <div className="p-6 text-red-500">Không tìm thấy sản phẩm</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Chỉnh sửa sản phẩm</h1>

      <form
        onSubmit={handleSaveProduct}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* LEFT SIDE: FORM */}
        <div className="flex flex-col gap-4">
          <input
            className="border p-2 rounded"
            value={form.name}
            placeholder="Tên sản phẩm"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            type="number"
            className="border p-2 rounded"
            value={form.price}
            placeholder="Giá"
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />

          <input
            type="number"
            className="border p-2 rounded"
            value={form.stock}
            placeholder="Kho"
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            required
          />

          <input
            className="border p-2 rounded"
            value={form.brandId}
            placeholder="Brand ID"
            onChange={(e) => setForm({ ...form, brandId: e.target.value })}
          />

          <input
            className="border p-2 rounded"
            value={form.categoryId}
            placeholder="Category ID"
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          />
        </div>

        {/* RIGHT SIDE: IMAGES */}
        <div className="flex flex-col gap-3">
          {/* Upload new images */}
          <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded w-max flex items-center gap-2">
            <Plus size={16} /> Chọn ảnh mới
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (!e.target.files) return;
                setNewFiles(Array.from(e.target.files));
              }}
            />
          </label>

          {newFiles.length > 0 && (
            <button
              type="button"
              onClick={handleUploadImages}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Upload ảnh ({newFiles.length})
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative border rounded overflow-hidden">
                <img
                  src={API.replace("/api", "") + img}
                  alt=""
                  className="w-full h-32 object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SAVE */}
        <div className="col-span-full flex justify-end">
          <button className="bg-green-700 text-white px-6 py-2 rounded">
            Lưu thay đổi
          </button>
        </div>
      </form>

      {/* VARIANTS */}
      <div className="mt-10">
        <VariantsManager productId={product._id} />
      </div>
    </div>
  );
};

export default SellerEditProduct;
