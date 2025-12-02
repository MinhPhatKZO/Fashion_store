import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
}

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get("http://localhost:5000/api/products/featured");
        const products = Array.isArray(res.data) ? res.data : res.data.products || [];
        setFeaturedProducts(products);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải sản phẩm");
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading)
    return (
      <p className="text-center py-20 text-gray-400 text-lg">Đang tải sản phẩm...</p>
    );
  if (error)
    return (
      <p className="text-center py-20 text-red-500 text-lg">{error}</p>
    );

  const sliderSettings = {
    slidesToShow: 4,
    slidesToScroll: 1,
    infinite: true,
    arrows: true,
    dots: true,
    autoplay: true,
    autoplaySpeed: 2500,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center text-center text-white">
        <img
          src="https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?q=80&w=1170&auto=format&fit=crop"
          alt="FASHION STORE"
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute w-full h-full bg-black/40"></div>
        <div className="relative z-10 px-6">
          <h1 className="text-5xl md:text-6xl font-extralight tracking-wide mb-4">
           FASHION STORE
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl mx-auto">
            Khám phá bộ sưu tập thời trang sang trọng và đẳng cấp nhất.
          </p>
          <a
            href="/products"
            className="inline-block bg-blue-600 text-white px-10 py-3 rounded-full font-semibold hover:bg-blue-700 transition"
          >
            Xem bộ sưu tập
          </a>

        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight drop-shadow-lg">
            Sản phẩm nổi bật
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 font-semibold drop-shadow-sm">
            Chọn lựa kỹ càng từ những thiết kế tinh tế nhất
          </p>
        </div>

        <Slider {...sliderSettings}>
          {featuredProducts.map((product) => (
            <div key={product._id} className="px-3">
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-2 relative">
                {product.isOnSale && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    -{product.discountPercentage || 0}%
                  </span>
                )}
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </Slider>
      </section>
    </div>
  );
};

export default Home;

// Chỉ cần thay đổi vị trí của các arrow để không đè lên sản phẩm
function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -right-12 w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 z-20"
      onClick={onClick}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -left-12 w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-700 z-20"
      onClick={onClick}
    >
      <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}