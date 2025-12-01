import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
// Import ProductCard giả định đã được cập nhật để sử dụng giao diện mới
// Giả định ProductCard đã được điều chỉnh nút thành "Thêm vào giỏ hàng"
import ProductCard from "../components/ProductCard"; 
// Đã loại bỏ import Categories, Category (theo yêu cầu trước đó)
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Loader2, ShoppingCart, Star } from 'lucide-react';

// Khai báo lại các interfaces để đảm bảo Home.tsx hoạt động độc lập (nếu cần)
interface Image { url: string; alt?: string; isPrimary?: boolean; }
interface CategorySlim { _id: string; name: string; slug: string; }
interface Rating { average: number; count: number; }
interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images?: (Image | string)[];
  image?: string;
  description?: string;
  category?: CategorySlim;
  rating?: Rating;
  isFeatured?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
}

const API_URL = 'http://localhost:5000'; // Đảm bảo đồng bộ API URL

// === Component ProductCard Đơn giản cho trang Home (Sử dụng ProductCard từ Products.tsx để đồng bộ) ===
// Giả định: Bạn đã có component ProductCard được đồng bộ về giao diện

const HomeProductCard: React.FC<{ product: Product }> = ({ product }) => {
    // Hàm renderRating được sao chép từ Products.tsx để đồng bộ
    const renderRating = (average: number) => {
        const fullStars = Math.floor(average);
        const hasHalfStar = average % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        return (
            <div className="flex items-center space-x-0.5">
                {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
                {hasHalfStar && <div className="relative"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500 relative z-10" /><Star className="w-4 h-4 text-gray-300 absolute top-0 left-0" style={{ clipPath: 'polygon(50% 0%, 50% 100%, 100% 100%, 100% 0%)' }} /></div>}
                {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />)}
            </div>
        );
    };

    const getImageUrl = (p: Product): string => {
        if (p.images && p.images.length > 0) {
            const firstImage = p.images[0];
            let imageUrl: string;
            if (typeof firstImage === 'object' && firstImage.url) {
                const primaryImage = p.images.find(img => typeof img === 'object' && (img as Image).isPrimary);
                imageUrl = primaryImage ? (primaryImage as Image).url : (firstImage as Image).url;
            } else if (typeof firstImage === 'string') imageUrl = firstImage;
            else return 'https://via.placeholder.com/300x400?text=No+Image';
            return imageUrl.startsWith('http') ? imageUrl : imageUrl;
        }
        return 'https://via.placeholder.com/300x400?text=No+Image';
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 overflow-hidden group cursor-pointer"
            // onClick={() => window.location.href = `/products/${product._id}`} // Hoặc sử dụng useNavigate nếu có Router
        >
            <div className="relative">
                <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={handleImageError}
                />
                {product.isOnSale && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-md">
                        -{product.discountPercentage || 10}%
                    </span>
                )}
            </div>

            <div className="p-4">
                <h3 className="text-gray-900 font-semibold text-lg mb-1 truncate">{product.name}</h3>
                {product.rating && (
                    <div className="flex items-center mb-2">
                        {renderRating(product.rating.average)}
                        <span className="ml-2 text-gray-500 text-sm">
                            ({product.rating.count})
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-blue-600 font-bold text-lg">
                        {product.price.toLocaleString('vi-VN')}₫
                    </span>
                    {product.originalPrice && (
                        <span className="text-gray-400 line-through text-sm">
                            {product.originalPrice.toLocaleString('vi-VN')}₫
                        </span>
                    )}
                </div>
                {/* ĐIỀU CHỈNH NÚT THÀNH "THÊM VÀO GIỎ HÀNG" */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); 
                        alert(`Đã thêm ${product.name} vào giỏ hàng!`);
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition text-sm font-semibold flex items-center justify-center gap-2"
                >
                    <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ hàng
                </button>
            </div>
        </div>
    );
};
// === Hết Component ProductCard Đơn giản ===


const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [onSaleProducts, setOnSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Đã bỏ selectedCategory và filteredProducts (vì đã bỏ lọc danh mục)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const featuredRes = await axios.get(
        `${API_URL}/api/products/featured`
      );
      const featured: Product[] = Array.isArray(featuredRes.data)
        ? featuredRes.data
        : featuredRes.data.products || [];
      setFeaturedProducts(featured);

      try {
        const saleRes = await axios.get(
          `${API_URL}/api/products/on-sale`
        );
        const onSale: Product[] = Array.isArray(saleRes.data)
          ? saleRes.data
          : saleRes.data.products || [];
        setOnSaleProducts(onSale);
      } catch {
        const saleProducts = featured.filter((p: Product) => p.isOnSale);
        setOnSaleProducts(saleProducts);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải sản phẩm. Kiểm tra API_URL hoặc server backend.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const sliderSettings = {
    autoplay: true,
    autoplaySpeed: 4000,
    infinite: true,
    dots: true,
    arrows: false,
    speed: 1000,
    cssEase: "cubic-bezier(0.7, 0, 0.3, 1)",
    pauseOnHover: false,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-gray-50 min-h-screen">
        <Loader2 className="animate-spin h-20 w-20 text-blue-600 mb-6" />
        <p className="text-gray-600 text-xl font-medium">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-40 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center shadow-lg max-w-lg mx-auto">
            <p className="text-red-600 font-bold text-2xl mb-4">❌ Lỗi kết nối hoặc tải dữ liệu</p>
            <p className="text-red-500 mb-6 text-base">{error}</p>
            <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition duration-300 shadow-md"
            >
            Thử lại
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {/* Hero Section - Đồng bộ màu sắc và font chữ */}
      <section className="relative text-center pt-20 pb-16 bg-white overflow-hidden shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-gray-900">
            Khám phá Phong cách Mới 🚀
          </h1>
          <p className="text-xl mb-10 text-gray-600 max-w-2xl mx-auto">
            Bộ sưu tập thời trang cập nhật liên tục, ưu đãi độc quyền hàng tuần.
          </p>
          <a
            href="/products"
            className="inline-block bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-xl shadow-blue-500/50"
          >
            Xem tất cả sản phẩm
          </a>
        </div>
        <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 relative z-10">
          <Slider {...sliderSettings}>
            {[
              "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?auto=format&fit=crop&w=1400&h=500&q=80",
              "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1400&h=500&q=80",
              "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1400&h=500&q=80",
              "https://images.unsplash.com/photo-1520975922320-37a0c390bca4?auto=format&fit=crop&w=1400&h=500&q=80",
            ].map((img, index) => (
              <div key={index} className="p-2">
                <img
                  src={img}
                  alt={`Fashion banner ${index + 1}`}
                  className="w-full h-96 object-cover rounded-3xl shadow-2xl border-4 border-gray-200 transition duration-500"
                />
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* Featured Products - Đồng bộ cấu trúc và Card */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">
              Bộ sưu tập
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
              ⭐ Sản phẩm nổi bật nhất
            </h2>
            <p className="text-lg text-gray-600 mt-4">
              Những mặt hàng được khách hàng yêu thích và đánh giá cao
            </p>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-100">
              <p className="text-gray-500 text-xl font-medium mb-6">
                Hiện chưa có sản phẩm nổi bật nào.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 8).map((product) => (
                  // Sử dụng HomeProductCard (giả định là ProductCard đã đồng bộ)
                  <HomeProductCard key={product._id} product={product} /> 
                ))}
              </div>

              {featuredProducts.length > 8 && (
                <div className="text-center mt-12">
                  <a
                    href="/products"
                    className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-xl"
                  >
                    Xem tất cả sản phẩm
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      <hr className="border-t border-gray-200 my-0" />

      {/* On Sale Products - Đồng bộ cấu trúc và Card */}
      {onSaleProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-red-600 text-sm font-semibold uppercase tracking-widest">
                    Ưu đãi đặc biệt
                </span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
                🔥 Sản phẩm giảm giá hot nhất
              </h2>
              <p className="text-lg text-gray-600 mt-4">
                Đừng bỏ lỡ cơ hội sở hữu sản phẩm yêu thích với giá tốt nhất!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {onSaleProducts.slice(0, 8).map((product) => (
                // Sử dụng HomeProductCard (giả định là ProductCard đã đồng bộ)
                <HomeProductCard key={product._id} product={product} />
              ))}
            </div>

            {onSaleProducts.length > 8 && (
              <div className="text-center mt-12">
                <a
                  href="/products?filter=sale"
                  className="inline-block bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition duration-300 shadow-xl shadow-red-500/50"
                >
                  Xem tất cả khuyến mãi
                </a>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;