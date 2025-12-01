import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import VariantManager from "./VariantManager";
import { Plus, X, Upload, Edit, Trash, Loader2, Tag, List, Box } from "lucide-react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const api = axios.create({
    baseURL: API,
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

// ===========================================
// ⭐ INTERFACES (Giữ nguyên)
// ===========================================
interface Category {
    _id: string;
    name: string;
}

interface Brand {
    _id: string;
    name: string;
}

interface ProductImage {
    url: string; // url từ server, vd: "/assets/products/xxx.jpg"
    alt?: string;
}

interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    description?: string; // Thêm description để có thể chỉnh sửa
    categoryId?: Category | string;
    brandId?: Brand | string;
    images: ProductImage[];
}

// ===========================================
// ⭐ LOADER & ERROR COMPONENTS
// ===========================================
const Loader = () => (
    <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mb-4" />
        <p className="text-gray-600 font-medium">Đang tải dữ liệu sản phẩm...</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-20 min-h-[50vh] bg-red-50 rounded-xl m-6">
        <p className="text-xl font-medium text-red-700">{message}</p>
        <p className="text-sm text-red-500 mt-2">Vui lòng kiểm tra kết nối mạng hoặc quyền truy cập.</p>
    </div>
);

const SellerEditProduct: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        price: 0,
        stock: 0,
        description: "", // Thêm vào form
        categoryId: "",
        brandId: "",
    });

    const [newImages, setNewImages] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Load product, brands, categories
    useEffect(() => {
        const loadData = async () => {
            try {
                const [brandsRes, categoriesRes, productRes] = await Promise.all([
                    api.get("/brands"),
                    api.get("/categories"),
                    api.get(`/seller/products/${id}`),
                ]);

                setBrands(brandsRes.data.brands || brandsRes.data);
                setCategories(categoriesRes.data.categories || categoriesRes.data);
                const p: Product = productRes.data.product;
                setProduct(p);

                setForm({
                    name: p.name,
                    price: p.price,
                    stock: p.stock,
                    description: p.description || "", // Lấy description
                    categoryId: typeof p.categoryId === "string" ? p.categoryId : p.categoryId?._id || "",
                    brandId: typeof p.brandId === "string" ? p.brandId : p.brandId?._id || "",
                });

                setLoading(false);
            } catch (err: any) {
                console.error("Error loading product:", err);
                setError("Không thể load dữ liệu sản phẩm. Vui lòng kiểm tra ID.");
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        // Xử lý giá trị số
        let value: string | number = e.target.value;
        if (e.target.name === 'price' || e.target.name === 'stock') {
            value = parseInt(value, 10) || 0;
        }

        setForm({ ...form, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await api.put(`/seller/products/${id}`, form);
            alert("Cập nhật thông tin cơ bản sản phẩm thành công!");
            // Cập nhật lại state product cục bộ sau khi update thành công
            setProduct(prev => prev ? ({ ...prev, ...form }) : null);
        } catch (err: any) {
            console.error("Update product error:", err);
            alert("Cập nhật sản phẩm thất bại!");
        } finally {
            setIsUpdating(false);
        }
    };

    // ================== IMAGE UPLOAD HANDLERS ==================
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Chỉ lấy các file mới, không trùng lặp
            const newFiles = Array.from(e.target.files).filter(
                file => !newImages.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)
            );
            setNewImages([...newImages, ...newFiles]);
        }
    };
    
    const handleRemoveNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadImages = async () => {
        if (!newImages.length) return alert("Vui lòng chọn ảnh trước khi upload!");
        setUploading(true);
        try {
            const formData = new FormData();
            newImages.forEach((file) => formData.append("images", file));

            const res = await api.post(`/seller/products/${id}/images`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Sau khi upload, cập nhật lại product state với danh sách ảnh mới
            setProduct(res.data.product);
            setNewImages([]);
            alert("✅ Upload ảnh thành công!");
        } catch (err) {
            console.error("Upload images error:", err);
            alert("❌ Upload ảnh thất bại!");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async (index: number) => {
        if (!product) return;
        if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;
        
        const imagesCopy = [...product.images];
        imagesCopy.splice(index, 1);
        
        try {
            // Gửi yêu cầu cập nhật danh sách ảnh (cần backend xử lý xóa file vật lý nếu cần)
            const res = await api.put(`/seller/products/${id}`, { ...form, images: imagesCopy });
            setProduct(res.data.product); // Cập nhật từ response để đảm bảo đồng bộ
            alert("✅ Xóa ảnh thành công!");
        } catch (err) {
            console.error("Remove image error:", err);
            alert("❌ Xóa ảnh thất bại!");
        }
    };

    // Helper: Định dạng URL ảnh
    const getImageUrl = (url: string) => {
        return url.startsWith("http") || url.startsWith("/assets") ? url : `/assets/products/${url}`;
    };

    if (loading) return <Loader />;
    if (error) return <ErrorDisplay message={error} />;
    if (!product) return <ErrorDisplay message="Không tìm thấy sản phẩm" />;


    return (
        <div className="bg-gray-50 min-h-screen p-6 sm:p-8 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Edit className="w-8 h-8 text-indigo-600" />
                        Chỉnh sửa Sản phẩm: <span className="text-indigo-600">{product.name}</span>
                    </h1>
                    <Link
                        to="/seller/products"
                        className="text-indigo-600 hover:text-indigo-800 transition font-medium"
                    >
                        &larr; Quay lại danh sách
                    </Link>
                </div>

                {/* Nội dung chính: FORM & IMAGES & VARIANTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cột 1 & 2: Thông tin Cơ bản và Hình ảnh */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* 1. THÔNG TIN CƠ BẢN */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <List className="w-5 h-5 text-blue-600" /> Thông tin cơ bản
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Tên sản phẩm</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Mô tả sản phẩm</label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        maxLength={2000}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Giá (VND)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={form.price}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            required
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Tồn kho chung</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={form.stock}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            required
                                            min={0}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Danh mục</label>
                                        <select
                                            name="categoryId"
                                            value={form.categoryId}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-white"
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map((c) => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Thương hiệu</label>
                                        <select
                                            name="brandId"
                                            value={form.brandId}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition bg-white"
                                        >
                                            <option value="">-- Chọn thương hiệu --</option>
                                            {brands.map((b) => (
                                                <option key={b._id} value={b._id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={`w-full flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
                                        isUpdating 
                                            ? 'bg-blue-300 text-white cursor-not-allowed' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-400/50'
                                    }`}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Tag className="w-5 h-5" />}
                                    {isUpdating ? "Đang lưu..." : "Lưu Thông tin Cơ bản"}
                                </button>
                            </form>
                        </div>

                        {/* 2. QUẢN LÝ BIẾN THỂ (VariantManager) */}
                        {/* Giữ nguyên VariantManager, chỉ bao bọc lại giao diện container */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Box className="w-5 h-5 text-indigo-600" /> Quản lý Biến thể (Variants)
                            </h2>
                            <VariantManager 
                                productId={id!}
                                productName={product.name} />
                        </div>
                    </div>
                    
                    {/* Cột 3: Hình ảnh */}
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-4">
                            <h2 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-pink-600" /> Hình ảnh sản phẩm
                            </h2>

                            {/* HIỂN THỊ ẢNH HIỆN TẠI */}
                            <div className="space-y-4 mb-6">
                                <p className="font-medium text-gray-700">Ảnh hiện tại ({product.images.length})</p>
                                <div className="flex flex-wrap gap-3">
                                    {product.images.length > 0 ? (
                                        product.images.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={getImageUrl(img.url)}
                                                    alt={img.alt || product.name}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm transition-all group-hover:shadow-md"
                                                />
                                                <button
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">Chưa có hình ảnh nào được tải lên.</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* KHU VỰC UPLOAD ẢNH MỚI */}
                            <div className="pt-4 border-t border-gray-200">
                                <p className="font-medium text-gray-700 mb-3">Thêm ảnh mới</p>
                                
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={handleFilesChange} 
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />

                                {/* Xem trước ảnh mới */}
                                {newImages.length > 0 && (
                                    <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Ảnh đang chờ upload:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {newImages.map((file, index) => (
                                                <div key={index} className="relative group">
                                                    <img 
                                                        src={URL.createObjectURL(file)} 
                                                        alt={`New image ${index}`} 
                                                        className="w-16 h-16 object-cover rounded-md border"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveNewImage(index)}
                                                        className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full p-1 transform hover:scale-110"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleUploadImages}
                                    className={`w-full flex justify-center items-center gap-2 mt-4 px-3 py-2 rounded-lg font-semibold transition text-sm ${
                                        newImages.length === 0 || uploading
                                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                            : 'bg-pink-600 text-white hover:bg-pink-700'
                                    }`}
                                    disabled={uploading || newImages.length === 0}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                                    {uploading ? "Đang upload..." : `Tải lên ${newImages.length} ảnh`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="pt-6 text-center">
                    <Link to="/seller/products" className="text-sm text-gray-500 hover:text-indigo-600 transition">
                        Hoàn tất chỉnh sửa và quay lại trang quản lý.
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SellerEditProduct;