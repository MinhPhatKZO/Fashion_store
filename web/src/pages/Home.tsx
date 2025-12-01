import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { Loader2, ShoppingCart, Star } from 'lucide-react';

// ===========================================
// ⭐ INTERFACES (Giữ nguyên)
// ===========================================
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

const API_URL = 'http://localhost:5000'; 

// ===========================================
// ⭐ HOME PRODUCT CARD (Đã Tối ưu hóa giao diện và Logic Star)
// ===========================================
const HomeProductCard: React.FC<{ product: Product }> = ({ product }) => {
    
    // Hàm render rating được tối ưu
    const renderRating = (average: number) => {
        const fullStars = Math.floor(average);
        const hasHalfStar = average % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        const stars = [];
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Star key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-yellow-500" />);
        }
        if (hasHalfStar) {
            stars.push(
                <div key="half" className="relative">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 relative z-10" />
                    <Star className="w-4 h-4 text-gray-300 absolute top-0 left-0" style={{ clipPath: 'polygon(50% 0%, 50% 100%, 100% 100%, 100% 0%)' }} />
                </div>
            );
        }
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
        }

        return (
            <div className="flex items-center space-x-0.5">
                {stars}
            </div>
        );
    };

    const getImageUrl = (p: Product): string => {
    // Nếu có mảng images
    if (p.images && p.images.length > 0) {
        const primaryImage = p.images.find(img => typeof img === 'object' && (img as Image).isPrimary) as Image | undefined;
        const firstImage = p.images[0];

        if (primaryImage?.url) return primaryImage.url;
        if (typeof firstImage === 'object' && firstImage.url) return firstImage.url;
        if (typeof firstImage === 'string') return firstImage;
    }

    // Nếu có trường image riêng lẻ
    if (p.image) return p.image;

    // Fallback placeholder
    return 'https://via.placeholder.com/300x400?text=No+Image';
};

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        // Chỉ thay thế nếu ảnh lỗi là ảnh chính (tránh lỗi lặp vô hạn)
        e.currentTarget.src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group cursor-pointer flex flex-col h-full"
            // Thêm link chi tiết sản phẩm
            // onClick={() => window.location.href = `/products/${product._id}`} 
        >
            <div className="relative flex-shrink-0">
                <img
                    src={getImageUrl(product)}
                    alt={product.name}
                    className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={handleImageError}
                />
                {product.isOnSale && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white">
                        -{product.discountPercentage || 10}%
                    </span>
                )}
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-gray-900 font-bold text-lg mb-1 truncate group-hover:text-blue-600 transition">{product.name}</h3>
                {product.rating && (
                    <div className="flex items-center mb-3">
                        {renderRating(product.rating.average)}
                        <span className="ml-2 text-gray-500 text-sm">
                            ({product.rating.count})
                        </span>
                    </div>
                )}
                
                <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-blue-600 font-extrabold text-xl">
                            {product.price.toLocaleString('vi-VN')}₫
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-gray-400 line-through text-base">
                                {product.originalPrice.toLocaleString('vi-VN')}₫
                            </span>
                        )}
                    </div>
                    
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); 
                            alert(`Đã thêm ${product.name} vào giỏ hàng!`);
                        }}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition text-base font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <ShoppingCart className="w-5 h-5" /> Thêm vào giỏ hàng
                    </button>
                </div>
            </div>
        </div>
    );
};
// ===========================================
// ⭐ HẾT HOME PRODUCT CARD
// ===========================================

// ===========================================
// ⭐ SLIDER IMAGE DATA (Sử dụng link hình ảnh thực tế)
// ===========================================
const FASHION_BANNERS = [
  {
    url: "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
    alt: "Fashion runway model"
  },
  {
    url: "https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg",
    alt: "Streetwear photoshoot"
  },
  {
    url: "https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg",
    alt: "Store interior clothes"
  },
  {
    url: "https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg",
    alt: "Fashion accessories display"
  },
  {
    url: "https://images.pexels.com/photos/6311572/pexels-photo-6311572.jpeg",
    alt: "Street style fashion"
  }
];


const Home: React.FC = () => {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [onSaleProducts, setOnSaleProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch Featured Products
            const featuredRes = await axios.get(
                `${API_URL}/api/products/featured`
            );
            const featured: Product[] = Array.isArray(featuredRes.data)
                ? featuredRes.data
                : featuredRes.data.products || [];
            setFeaturedProducts(featured);

            // Fetch On Sale Products (Dùng logic fallback nếu API không có)
            try {
                const saleRes = await axios.get(
                    `${API_URL}/api/products/on-sale`
                );
                const onSale: Product[] = Array.isArray(saleRes.data)
                    ? saleRes.data
                    : saleRes.data.products || [];
                setOnSaleProducts(onSale);
            } catch {
                // Fallback: Lọc từ featured nếu API on-sale bị lỗi
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
        autoplaySpeed: 2500,
        infinite: true,
        dots: true,
        arrows: true, 
        speed: 1000,
        cssEase: "cubic-bezier(0.7, 0, 0.3, 1)",
        pauseOnHover: true,
        slidesToShow: 1,
        slidesToScroll: 1,
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
            {/* Hero Section */}
            <section className="relative text-center pt-16 pb-12 bg-white overflow-hidden shadow-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight text-gray-900">
                        Khám phá Phong cách Mới 
                    </h1>
                    <p className="text-xl mb-10 text-gray-600 max-w-2xl mx-auto">
                        Bộ sưu tập thời trang cập nhật liên tục, ưu đãi độc quyền hàng tuần.
                    </p>
                    <a
                        href="/products"
                        className="inline-block bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-2xl shadow-blue-500/50"
                    >
                        Xem tất cả sản phẩm
                    </a>
                </div>

                {/* Slider */}
                <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                        <Slider {...sliderSettings}>
                            {FASHION_BANNERS.map((banner, index) => (
                                <div key={index} className="focus:outline-none">
                                    <div className="relative h-[400px] sm:h-[500px] w-full">
                                        <img
                                            src={banner.url}
                                            alt={banner.alt}
                                            className="w-full h-full object-cover transition duration-500"
                                        />
                                        {/* Overlay nhẹ để banner rõ hơn */}
                                        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                </div>
            </section>
            
            ---

            {/* Featured Products - Sản phẩm nổi bật */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">
                            Bộ sưu tập
                        </span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
                            Sản phẩm nổi bật nhất
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
                                    <HomeProductCard key={product._id} product={product} /> 
                                ))}
                            </div>

                            {featuredProducts.length > 8 && (
                                <div className="text-center mt-16">
                                    <a
                                        href="/products"
                                        className="inline-block bg-blue-600 text-white px-10 py-3 rounded-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-xl"
                                    >
                                        Xem thêm sản phẩm nổi bật
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
            
            <hr className="border-t border-gray-200 my-0" />

            {/* On Sale Products - Sản phẩm giảm giá */}
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
                                <HomeProductCard key={product._id} product={product} />
                            ))}
                        </div>

                        {onSaleProducts.length > 8 && (
                            <div className="text-center mt-16">
                                <a
                                    href="/products?filter=sale"
                                    className="inline-block bg-red-600 text-white px-10 py-3 rounded-xl font-semibold hover:bg-red-700 transition duration-300 shadow-xl shadow-red-500/50"
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