import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import Categories, { Category } from "../components/Categories";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";

interface Image {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface CategorySlim {
  _id: string;
  name: string;
  slug: string;
}

interface Rating {
  average: number;
  count: number;
}

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

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [onSaleProducts, setOnSaleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const featuredRes = await axios.get(
          "http://localhost:5000/api/products/featured"
        );
        const featured = Array.isArray(featuredRes.data)
          ? featuredRes.data
          : featuredRes.data.products || [];
        setFeaturedProducts(featured);

        try {
          const saleRes = await axios.get(
            "http://localhost:5000/api/products/on-sale"
          );
          const onSale = Array.isArray(saleRes.data)
            ? saleRes.data
            : saleRes.data.products || [];
          setOnSaleProducts(onSale);
        } catch {
          const saleProducts = featured.filter((p: Product) => p.isOnSale);
          setOnSaleProducts(saleProducts);
        }

        setLoading(false);
      } catch (error: any) {
        setError(error.response?.data?.message || "Không thể tải sản phẩm");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = featuredProducts.filter(
        (p) => p.category?._id === selectedCategory._id
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(featuredProducts);
    }
  }, [selectedCategory, featuredProducts]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 text-lg">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 text-lg mb-4">❌ {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <h1 className="text-4xl font-bold mb-4">Chào mừng đến với Fashion Store</h1>
        <p className="text-lg mb-8">
          Khám phá các sản phẩm thời trang nổi bật và ưu đãi hấp dẫn!
        </p>
        <a
          href="/products"
          className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
        >
          Khám phá ngay
        </a>
         <div className="max-w-5xl mx-auto mt-12">
    <Slider
      autoplay
      autoplaySpeed={3000}
      infinite
      dots
      arrows={false}
      speed={1000}
      cssEase="ease-in-out"
      pauseOnHover={false}
    >
      {[
        "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47",
        "https://images.unsplash.com/photo-1521334884684-d80222895322",
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb",
        "https://images.unsplash.com/photo-1520975922320-37a0c390bca4"
      ].map((img, index) => (
        <div key={index}>
          <img
            src={img + "?auto=format&fit=crop&w=1600&q=80"}
            alt={`Fashion banner ${index + 1}`}
            className="w-full h-80 object-cover rounded-2xl shadow-lg transition-transform duration-500 hover:scale-[1.02]"
          />
        </div>
      ))}
    </Slider>
  </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Danh mục sản phẩm</h2>
            <p className="text-gray-600">Tìm kiếm theo danh mục yêu thích</p>
          </div>

          <Categories onSelect={setSelectedCategory} />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">⭐ Sản phẩm nổi bật</h2>
            <p className="text-gray-600">Những sản phẩm được yêu thích nhất hiện nay</p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                Chưa có sản phẩm nổi bật nào cho danh mục này.
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:underline font-semibold"
              >
                Xem tất cả sản phẩm →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {filteredProducts.length > 8 && (
            <div className="text-center mt-8">
              <a
                href="/products"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Xem thêm sản phẩm
              </a>
            </div>
          )}
        </div>
      </section>

      {/* On Sale Products */}
      {onSaleProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🔥 Sản phẩm giảm giá</h2>
              <p className="text-gray-600">Cơ hội vàng - mua sắm tiết kiệm</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {onSaleProducts.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {onSaleProducts.length > 8 && (
              <div className="text-center mt-8">
                <a
                  href="/products?filter=sale"
                  className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
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

