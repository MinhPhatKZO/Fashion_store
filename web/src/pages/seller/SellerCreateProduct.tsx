import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, DollarSign, List, Image as ImageIcon, Loader2, Package } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const API_URL = API + "/seller/products";

export default function SellerCreateProduct() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        price: "",
        description: "",
        stock: "1",
        categoryId: "", 
        brandId: "",
    });

    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file)); // Tạo URL xem trước
        } else {
            setImage(null);
            setPreviewUrl(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
            alert("Bạn cần đăng nhập để tạo sản phẩm.");
            setLoading(false);
            return;
        }
        
        if (!form.name || !form.price || !form.description || !image) {
            alert("Vui lòng điền đầy đủ Tên, Giá, Mô tả và chọn ít nhất 1 Ảnh.");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("price", form.price);
            formData.append("description", form.description);
            formData.append("stock", form.stock); 
            formData.append("images", image); 

            const res = await axios.post(
                API_URL,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log(res.data);
            alert("Tạo sản phẩm thành công!");
            navigate("/seller/products"); // Chuyển hướng về trang quản lý sản phẩm
        } catch (error: any) {
            console.error("Lỗi khi tạo sản phẩm:", error.response?.data || error);
            alert(error.response?.data?.message || "Lỗi server hoặc token hết hạn.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-6 sm:p-8 lg:p-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100 flex items-center gap-3">
                    <Plus className="w-7 h-7 text-indigo-600" />
                    <h1 className="text-3xl font-extrabold text-gray-900">Thêm Sản phẩm Mới</h1>
                </div>

                <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <List className="w-5 h-5 text-blue-600" /> Thông tin sản phẩm
                            </h2>
                            
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Tên sản phẩm (*)</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Áo thun cơ bản, Sạc nhanh Type C,..."
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 flex items-center gap-1">
                                        <DollarSign className="w-4 h-4 text-green-600" /> Giá bán (*)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="500000"
                                        value={form.price}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 flex items-center gap-1">
                                        <Package className="w-4 h-4 text-indigo-600" /> Tồn kho ban đầu (*)</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        placeholder="100"
                                        value={form.stock}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <label className="block mb-1 text-sm font-medium text-gray-700">Mô tả sản phẩm (*)</label>
                                <textarea
                                    name="description"
                                    placeholder="Mô tả chi tiết về sản phẩm..."
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className={`w-full flex justify-center items-center gap-2 mt-6 px-6 py-3 rounded-xl font-semibold transition ${
                                    loading 
                                        ? 'bg-indigo-300 text-white cursor-not-allowed' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-400/50'
                                }`}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {loading ? "Đang tạo..." : "Tạo Sản phẩm Mới"}
                            </button>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-pink-600" /> Ảnh đại diện (*)
                            </h2>
                            
                            <div className="mb-4">
                                <input 
                                    type="file" 
                                    onChange={handleFile} 
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                                    accept="image/*"
                                    required
                                />
                            </div>

                            <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 h-56 flex items-center justify-center">
                                {previewUrl ? (
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        className="max-h-full max-w-full object-contain rounded-md shadow-md"
                                    />
                                ) : (
                                    <p className="text-gray-400 text-center italic">
                                        Ảnh sản phẩm sẽ hiển thị ở đây.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}