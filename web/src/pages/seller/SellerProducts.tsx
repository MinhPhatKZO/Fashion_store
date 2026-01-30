import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  Plus, Edit, Trash2, Search, Package, 
  MoreVertical, AlertCircle, ImageIcon, Loader2 
} from "lucide-react";

// Định nghĩa lại API Base để tái sử dụng
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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
  description?: string;
};

// Component Loader
const Loader = () => (
  <div className="flex justify-center items-center py-20">
    <Loader2 className="animate-spin text-gray-400 w-10 h-10" />
  </div>
);

const SellerProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- API FETCH ---
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE}/seller/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data.products) ? res.data.products : [];
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error("Lỗi tải sản phẩm", err);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- XỬ LÝ TÌM KIẾM ---
  useEffect(() => {
    const results = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  // --- XỬ LÝ XÓA ---
  const handleDelete = async (id: string) => {
    // Dùng window.confirm tạm thời, có thể thay bằng Custom Modal sau này
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;

    const toastId = toast.loading("Đang xóa...");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/seller/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Đã xóa sản phẩm", { id: toastId });
    } catch (err) {
      console.error("Lỗi xóa sản phẩm", err);
      toast.error("Xóa thất bại", { id: toastId });
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER: Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-sm text-gray-500 mt-1">
              Hiển thị tất cả <span className="font-semibold text-gray-900">{products.length}</span> sản phẩm của bạn
            </p>
          </div>
          
          <div className="flex gap-3">
             <Link
              to="/seller/products/create"
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/20 font-medium"
            >
              <Plus className="w-5 h-5" /> Thêm mới
            </Link>
          </div>
        </div>

        {/* TOOLBAR: Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Tìm kiếm theo tên sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-900 rounded-lg outline-none transition-all"
                />
            </div>
            {/* Có thể thêm bộ lọc Category ở đây sau này */}
        </div>

        {/* CONTENT */}
        {loading ? (
          <Loader />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 mt-1">Thử thay đổi từ khóa hoặc thêm sản phẩm mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product._id} 
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden flex flex-col"
              >
                {/* Image Area */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img 
                        src={product.images?.[0]?.url || "https://via.placeholder.com/300x300?text=No+Image"} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Status Badge */}
                    {(product.stock ?? 0) <= 0 && (
                        <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                            Hết hàng
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1" title={product.name}>
                            {product.name}
                        </h3>
                        <p className="text-lg font-bold text-gray-900">
                            {formatPrice(product.price)}
                        </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            <span>Kho: <b className="text-gray-900">{product.stock ?? 0}</b></span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <Link
                            to={`/seller/products/edit/${product._id}`}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Edit className="w-4 h-4" /> Sửa
                        </Link>
                        <button
                            onClick={() => handleDelete(product._id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-gray-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;