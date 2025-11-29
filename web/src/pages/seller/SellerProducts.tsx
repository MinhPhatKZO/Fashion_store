import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Plus, Edit, Trash, Image as ImageIcon, Package, Tag } from "lucide-react";

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
};

const Loader = () => (
  <div className="flex justify-center py-10">
    <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
  </div>
);

const ProductCard: React.FC<{ product: Product; onDelete: (id: string) => void }> = ({
  product,
  onDelete,
}) => {
  if (!product) return null;

  const img = product.images?.[0]?.url || "https://via.placeholder.com/300x300?text=No+Image";

  return (
    <div className="bg-white shadow rounded-xl p-4 flex flex-col hover:shadow-lg transition">
      <img src={img} alt={product.name || "product"} className="w-full h-40 object-cover rounded-lg mb-3" />
      <h3 className="text-lg font-semibold">{product.name || "Tên sản phẩm trống"}</h3>
      <div className="text-gray-600 text-sm mt-1 flex items-center gap-1">
        <Tag className="w-4 h-4" /> {(product.price ?? 0).toLocaleString()} đ
      </div>
      <div className="text-gray-600 text-sm flex items-center gap-1 mt-1">
        <Package className="w-4 h-4" /> {product.stock ?? 0} trong kho
      </div>
      <div className="flex justify-between items-center mt-4">
        <Link
          to={`/seller/products/edit/${product._id}`}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
        >
          <Edit className="w-4 h-4" /> Sửa
        </Link>
        <button
          onClick={() => onDelete(product._id)}
          className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
        >
          <Trash className="w-4 h-4" /> Xóa
        </button>
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
    if (!window.confirm("Bạn chắc chắn muốn xoá sản phẩm này?")) return;
    try {
      await api.delete(`/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Lỗi khi xoá sản phẩm", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm của bạn</h1>
        <Link
          to="/seller/products/create"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" /> Thêm sản phẩm
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-60" />
          Chưa có sản phẩm nào
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Active route: <span className="text-blue-600 font-semibold">{location.pathname}</span>
      </div>
    </div>
  );
};

export default SellerProducts;
