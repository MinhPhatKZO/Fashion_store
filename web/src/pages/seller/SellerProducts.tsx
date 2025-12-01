import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Plus, Edit, Trash, Package, Loader2, DollarSign } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_BASE + "/seller/products",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

type ImageItem = {
    url: string;
    isPrimary?: boolean;
};

type Product = {
    _id: string;
    name: string;
    price: number;
    stock?: number;
    images?: ImageItem[];
    brandId?: any;
    categoryId?: any;
    isActive?: boolean;
    createdAt?: string;
};


const Loader = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-inner border border-gray-100">
        <Loader2 className="animate-spin h-10 w-10 text-gray-500 mb-4" />
        <p className="text-gray-600 font-medium">Đang tải sản phẩm...</p>
    </div>
);

const ProductCard: React.FC<{ product: Product; onDelete: (id: string) => Promise<void> }> = ({
    product,
    onDelete,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!product) return null;

    const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
    const img = primaryImage || "https://via.placeholder.com/350x450?text=No+Image";

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = 'https://via.placeholder.com/350x450?text=Image+Not+Found';
    };

    const isOutOfStock = (product.stock ?? 0) === 0;
    const isDraft = !product.isActive;
    
    const getStatusBadge = () => {
        if (isOutOfStock) {
            return {
                text: 'Hết hàng',
                style: 'bg-red-500 text-white' // Màu đỏ cho Hết hàng
            };
        }
        if (isDraft) {
            return {
                text: 'Nháp',
                style: 'bg-yellow-500 text-gray-800' // Màu vàng cho Nháp
            };
        }
        return {
            text: 'Đang Bán',
            style: 'bg-green-500 text-white' // Màu xanh lá cho Đang Bán
        };
    };

    const status = getStatusBadge();

    const handleDeleteClick = async () => {
        if (isDeleting) return;

        if (!window.confirm(`Cảnh báo! Bạn chắc chắn muốn xoá sản phẩm "${product.name}" vĩnh viễn?`)) {
            return;
        }

        setIsDeleting(true);
        
        try {
            await onDelete(product._id);
        } catch (error) {
            setIsDeleting(false); 
            console.error("Lỗi khi xoá sản phẩm tại Card:", error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col transition-all duration-300 transform hover:shadow-xl hover:scale-[1.01] overflow-hidden">
            
            <div className="relative w-full h-48 overflow-hidden bg-gray-50">
                <img 
                    src={img} 
                    alt={product.name || "product"} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                    onError={handleImageError}
                />
                <span 
                    className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full shadow-md ${status.style}`}
                >
                    {status.text}
                </span>
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={product.name}>
                    {product.name || "Tên sản phẩm trống"}
                </h3>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-700 font-semibold text-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        {(product.price ?? 0).toLocaleString('vi-VN')} đ
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Package className="w-4 h-4 text-indigo-500" /> 
                        Tồn kho: <span className={`font-medium ${isOutOfStock ? 'text-red-500' : 'text-gray-700'}`}>{product.stock ?? 0}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-auto border-t pt-4">
                    <Link
                        to={`/seller/products/edit/${product._id}`}
                        className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-md"
                    >
                        <Edit className="w-4 h-4" /> Chỉnh sửa
                    </Link>
                    <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition border shadow-sm
                            ${isDeleting
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                                : 'bg-white text-red-600 hover:bg-red-50 hover:border-red-400 border-red-300'
                            }`}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Đang xóa...
                            </>
                        ) : (
                            <>
                                <Trash className="w-4 h-4" /> Xóa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
const SellerProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/");
            const data = Array.isArray(res.data.products) ? res.data.products : [];
            setProducts(data);
        } catch (err) {
            console.error("Lỗi khi lấy sản phẩm", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/delete/${id}`);
            setProducts((prev) => prev.filter((p) => p._id !== id));
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Lỗi xóa sản phẩm. Vui lòng kiểm tra lại quyền truy cập.";
            alert(errorMessage);
            console.error("Lỗi khi xoá sản phẩm", err);
            throw err; 
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen p-6 sm:p-8 lg:p-10">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">📦 Quản lý Sản phẩm</h1>
                    <Link
                        to="/seller/products/create"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-400/50"
                    >
                        <Plus className="w-5 h-5" /> Thêm Sản phẩm Mới
                    </Link>
                </div>
            </div>
            
            <div className="p-4">
                {loading ? (
                    <Loader />
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-gray-100">
                        <Package className="w-16 h-16 mx-auto mb-5 text-gray-400 opacity-70" />
                        <h2 className="text-xl font-medium text-gray-700">Chưa có sản phẩm nào được tạo.</h2>
                        <p className="text-gray-500 mt-2">Bắt đầu bán hàng bằng cách thêm sản phẩm mới ngay!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((p) => (
                            <ProductCard key={p._id} product={p} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-10 pt-4 border-t text-center text-sm text-gray-500">
                <p>Tổng số sản phẩm: {products.length}</p>
                <p>Route hiện tại: <span className="text-indigo-600 font-semibold">{location.pathname}</span></p>
            </div>
        </div>
    );
};

export default SellerProducts;