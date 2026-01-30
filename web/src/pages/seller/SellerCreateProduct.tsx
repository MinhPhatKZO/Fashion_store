import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; // Dùng toast thay alert cho đẹp
import { Upload, Image as ImageIcon, Save, ArrowLeft, Loader2 } from "lucide-react";

export default function SellerCreateProduct() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      // Tạo URL preview ảnh ngay lập tức
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    // Validate cơ bản
    if (!form.name || !form.price) {
        toast.error("Vui lòng nhập tên và giá sản phẩm");
        return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Phiên đăng nhập hết hạn");
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("description", form.description);

      if (image) {
        formData.append("image", image);
      }

      await axios.post(
        "http://localhost:5000/api/seller/products",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Tạo sản phẩm thành công!");
      navigate("/seller/products"); // Quay về danh sách sau khi tạo xong
    } catch (error: any) {
      console.error("Lỗi:", error);
      toast.error(error.response?.data?.message || "Lỗi server khi tạo sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate("/seller/products")}
                    className="p-2 hover:bg-white rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
                    <p className="text-sm text-gray-500">Điền thông tin chi tiết cho sản phẩm của bạn</p>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate("/seller/products")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Hủy bỏ
                </button>
                <button 
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isLoading ? "Đang lưu..." : "Lưu sản phẩm"}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: General Info */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chung</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Ví dụ: Áo thun nam Basic..."
                                value={form.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ)</label>
                            <input
                                type="number"
                                name="price"
                                placeholder="0"
                                value={form.price}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
                            <textarea
                                name="description"
                                rows={6}
                                placeholder="Nhập mô tả chi tiết về chất liệu, kích thước..."
                                value={form.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all placeholder:text-gray-400 resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Image Upload */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h3>
                    
                    <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-gray-400 transition-colors">
                        {previewUrl ? (
                            <>
                                <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">Thay đổi ảnh</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <ImageIcon className="text-gray-400" size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Tải ảnh lên</p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG tối đa 5MB</p>
                            </div>
                        )}
                        
                        <input 
                            type="file" 
                            onChange={handleFile}
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    
                    <div className="mt-4 flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Upload size={20} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            Mẹo: Sử dụng hình ảnh chất lượng cao, tỉ lệ 1:1 hoặc 3:4 để sản phẩm hiển thị đẹp nhất.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}