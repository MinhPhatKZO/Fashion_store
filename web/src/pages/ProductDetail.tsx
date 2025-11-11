import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Image {
  url?: string;
  alt?: string;
}
interface Brand {
  _id: string;
  name: string;
  country?: string;
  description?: string;
  logoUrl?: string;
}
interface Category {
  _id: string;
  name: string;
}
interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  images?: (Image | string)[];
  isActive: boolean;
  isFeatured?: boolean;
  brand?: Brand;
  category?: Category;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // ✅ SỬA: Chỉ gọi fetchProduct ở đây
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}`);
        const data = await res.json();
        // Lấy ra product, có thể nằm trong data.product
        setProduct(data.product || data); 
      } catch (error) {
        console.error("❌ Lỗi tải sản phẩm:", error);
        // Cân nhắc setProduct(null) nếu muốn hiển thị lỗi 404/server
      }
    };
    fetchProduct();
  }, [id]);

  // ✅ THÊM: Effect mới để gọi route lấy sản phẩm liên quan chuyên biệt
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!id) return; // Đảm bảo có ID trước khi fetch
      try {
        // Gọi route chuyên biệt được tạo ở Server-side: /api/products/related/:id
        const res = await fetch(`http://localhost:5000/api/products/related/${id}`);
        const data = await res.json();
        // Server trả về { relatedProducts: related }
        setRelatedProducts(data.relatedProducts || []); 
      } catch (err) {
        console.error("❌ Lỗi tải sản phẩm liên quan:", err);
      }
    };
    // Ta chạy fetchRelatedProducts ngay khi id thay đổi (cũng là khi component mount/update)
    fetchRelatedProducts();
  }, [id]); // Phụ thuộc vào ID để fetch lại khi chuyển sang sản phẩm khác

  const getImageUrl = (p?: Product) => {
    if (!p) return "";
    if (p.images && p.images.length > 0) {
      const first = p.images[0];
      if (typeof first === "string") return first.startsWith("/") ? first : `/${first}`;
      if (typeof first === "object" && first.url) return first.url.startsWith("/") ? first.url : `/${first.url}`;
    }
    return "https://via.placeholder.com/600x800?text=No+Image";
  };

  const handleAddToCart = () => {
    if (!product) return;
    // Lấy giỏ hàng từ localStorage, nếu không có thì là object rỗng
    const localCart = JSON.parse(localStorage.getItem("localCart") || "{}");
    const items = localCart.items || [];
    const existingIndex = items.findIndex((i: any) => i._id === product._id);

    // Nếu sản phẩm đã có -> tăng quantity
    if (existingIndex >= 0) items[existingIndex].quantity += 1;
    // Nếu chưa có -> thêm mới với quantity = 1
    else items.push({ ...product, quantity: 1 });

    // Tính lại tổng giá
    const priceTotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    // Lưu lại vào localStorage
    localStorage.setItem("localCart", JSON.stringify({ items, priceTotal }));
    alert("🛒 Đã thêm sản phẩm!");
  };

  if (!product) return <p className="text-center py-10 text-gray-500">Đang tải sản phẩm...</p>;

  const sliderSettings = {
    dots: true,
    infinite: relatedProducts.length > 4,
    speed: 700,
    slidesToShow: Math.min(4, relatedProducts.length),
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2600,
    pauseOnHover: true,
    arrows: true,
  };

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Chi tiết */}
      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md">
          <img src={getImageUrl(product)} alt={product.name} className="w-full h-auto object-cover" />
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-red-600 text-2xl font-semibold mb-2">{product.price.toLocaleString("vi-VN")}đ</p>
          <p className="text-gray-700 mb-6">{product.description}</p>

          <button onClick={handleAddToCart} className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-3xl font-semibold text-center mb-6">Sản phẩm liên quan</h2>

          <Slider {...sliderSettings}>
            {relatedProducts.map((p) => (
              <div key={p._id} onClick={() => navigate(`/products/${p._id}`)} className="p-3 cursor-pointer">
                <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-xl transition-transform hover:-translate-y-1">
                  <div className="overflow-hidden">
                    <img
                      src={getImageUrl(p)}
                      alt={p.name}
                      className="w-full h-56 object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                  <div className="p-3 text-center">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-red-600 font-semibold">{p.price.toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
