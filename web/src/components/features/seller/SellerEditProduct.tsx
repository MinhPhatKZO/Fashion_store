import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Save, ArrowLeft, Loader2, Image as ImageIcon, X, UploadCloud 
} from "lucide-react";
import VariantsManager from "./VariantsManager";

// --- CONFIG ---
// Lấy URL gốc của server (VD: http://localhost:5000) để ghép ảnh
const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const SERVER_URL = API_BASE.replace("/api", ""); 

// --- TYPES ---
type ImageItem = {
  url: string;
  _id?: string;
};

type ProductResponse = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  brandId?: string;
  categoryId?: string;
  description?: string;
  images: (string | ImageItem)[]; 
};

const SellerEditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    brandId: "",
    categoryId: "",
    description: "",
  });

  const [images, setImages] = useState<(string | ImageItem)[]>([]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/seller/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const p: ProductResponse = res.data.product;
        
        setForm({
          name: p.name,
          price: p.price,
          stock: p.stock,
          brandId: p.brandId || "",
          categoryId: p.categoryId || "",
          description: p.description || "",
        });
        setImages(p.images || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Không thể tải sản phẩm");
        navigate("/seller/products");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, navigate]);

  // --- HÀM XỬ LÝ URL ẢNH (ĐÃ SỬA LỖI) ---
  const getImageUrl = (img: string | ImageItem): string => {
    // 1. Lấy chuỗi đường dẫn thô
    let src = typeof img === "string" ? img : img.url;
    if (!src) return "";

    // 2. Nếu là ảnh Online (http...) -> Dùng luôn
    if (src.startsWith("http")) return src;

    // 3. Xử lý đường dẫn Local (uploads/...)
    // - Đổi dấu "\" (Windows) thành "/"
    let cleanPath = src.replace(/\\/g, "/");
    // - Xóa dấu "/" ở đầu nếu có
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);

    // - Nếu DB chỉ lưu tên file (ví dụ "abc.jpg") mà không có "uploads/" -> Thêm vào
    // Tùy backend của bạn lưu thế nào, nhưng thêm check này cho chắc
    // if (!cleanPath.startsWith("uploads/")) {
    //    cleanPath = `uploads/${cleanPath}`;
    // }

    // Kết quả: http://localhost:5000/uploads/file.jpg
    return `${SERVER_URL}/${cleanPath}`;
  };

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const formData = new FormData();
    Array.from(e.target.files).forEach(file => formData.append("images", file));

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh...");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/seller/products/${id}/images`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
      });

      if (res.data.product?.images) {
         setImages(res.data.product.images);
      }
      toast.success("Thêm ảnh thành công", { id: toastId });
    } catch (error) {
      toast.error("Lỗi tải ảnh", { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/seller/products/${id}`, {
        ...form,
        images, 
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã lưu thay đổi!");
    } catch (error) {
      toast.error("Lỗi khi lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen justify-center items-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/seller/products")} className="rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Chỉnh sửa sản phẩm</h1>
              <p className="text-sm text-gray-500">ID: {id}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => navigate("/seller/products")} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50">Hủy</button>
             <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-70">
               {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
               Lưu thay đổi
             </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="font-semibold mb-4">Thông tin chung</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mô tả</label>
                  <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>
              </div>
            </div>

             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="font-semibold mb-4">Giá & Kho</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Giá bán</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tồn kho</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
               <h2 className="font-semibold mb-4">Biến thể</h2>
               <VariantsManager productId={id!} />
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Hình ảnh</h2>
                <label className="cursor-pointer text-blue-600 text-sm font-medium flex items-center gap-1">
                  <UploadCloud size={16} /> Thêm ảnh
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>

              {/* GRID ẢNH */}
              <div className="grid grid-cols-2 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100">
                    {/* HÌNH ẢNH SẢN PHẨM */}
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Nếu ảnh lỗi (404), ẩn thẻ img đi và hiện icon
                        e.currentTarget.style.display = "none";
                        // Hiện div fallback kế tiếp
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.classList.remove("hidden");
                        if (fallback) fallback.classList.add("flex");
                        
                        console.error("Lỗi hiển thị ảnh:", getImageUrl(img));
                      }}
                    />
                    
                    {/* FALLBACK (Hiện khi ảnh lỗi) - Thay thế placeholder online */}
                    <div className="hidden w-full h-full flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <ImageIcon size={24} />
                        <span className="text-[10px] mt-1">Lỗi ảnh</span>
                    </div>

                    <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-white p-1 rounded-full shadow hover:text-red-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {uploading && (
                    <div className="aspect-square rounded-lg border bg-gray-50 flex items-center justify-center">
                      <Loader2 className="animate-spin text-gray-400" />
                    </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="font-semibold mb-4">Tổ chức</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thương hiệu</label>
                  <input name="brandId" value={form.brandId} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="ID Thương hiệu" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Danh mục</label>
                  <input name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="ID Danh mục" />
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default SellerEditProduct;