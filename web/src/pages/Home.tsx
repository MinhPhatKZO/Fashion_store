import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Hook điều hướng
import ProductCard from "../components/ProductCard/ProductCard";
import Slider from "react-slick";
import { MessageCircle } from "lucide-react"; // Icon tin nhắn
import ChatBox from "../components/Chatbox/ChatBox";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:5000";

// --- HELPERS ---
const getMongoId = (id: any): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id.$oid) return id.$oid;
  if (id._id) return id._id.toString();
  return id.toString();
};

const getImageUrl = (url: string | undefined) => {
  if (!url) return "https://via.placeholder.com/300?text=No+Image";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
};

// Map tên brand sang file ảnh local (Dựa trên ảnh bạn cung cấp)
const getBrandLogo = (brandName: string): string => {
  const name = brandName.toLowerCase().replace(/\s/g, "");
  const logoMap: { [key: string]: string } = {
    nike: "/assets/logo/logonike.png",
    adidas: "/assets/logo/logoadidas.jpg",
    zara: "/assets/logo/logozara.jpg",
    "h&m": "/assets/logo/logohm.jpg",
    hm: "/assets/logo/logohm.jpg",
    gucci: "/assets/logo/logogucci.png",
  };
  return logoMap[name] || "https://via.placeholder.com/100x50?text=" + brandName;
};

// --- INTERFACES ---
interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images?: { url: string; alt?: string }[];
  image?: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
  brandId?: string;
}

interface Brand {
  _id: string;
  name: string;
  country: string;
  description: string;
  logoUrl: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO CHAT BOX ---
  const [activeChatBrand, setActiveChatBrand] = useState<Brand | null>(null);
  
  // Giả lập lấy User hiện tại từ localStorage (Bạn cần thay bằng context thật của bạn)
  const [currentUser, setCurrentUser] = useState<{_id: string, name: string} | null>(null);

  useEffect(() => {
      // Mock login check - Thay thế bằng logic Auth thực tế của bạn
      const userId = localStorage.getItem("userId") || "user123"; 
      const userName = localStorage.getItem("userName") || "Khách hàng";
      const token = localStorage.getItem("token"); // Kiểm tra token để biết đã login chưa

      if(token && userId) {
          setCurrentUser({ _id: userId, name: userName });
      }
  }, []);

  // --- LOGIC FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const results = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/products/featured`),
          axios.get(`${API_BASE_URL}/api/brands`),
          axios.get(`${API_BASE_URL}/api/products`),
        ]);

        const getData = (result: PromiseSettledResult<any>) => 
            result.status === 'fulfilled' ? result.value.data : [];

        const rawFeatured = getData(results[0]);
        const rawBrands = getData(results[1]);
        const rawProducts = getData(results[2]);

        const normalizeProducts = (data: any): Product[] => {
          if (!Array.isArray(data)) return [];
          return data.map((p: any) => ({
            ...p,
            _id: getMongoId(p._id),
            brandId: p.brandId ? getMongoId(p.brandId) : undefined,
            image: p.images && p.images.length > 0 ? getImageUrl(p.images[0].url) : getImageUrl(p.image),
          }));
        };

        const normalizeBrands = (data: any): Brand[] => {
          if (!Array.isArray(data)) return [];
          return data.map((b: any) => ({
            ...b,
            _id: getMongoId(b._id),
            logoUrl: getBrandLogo(b.name), 
          }));
        };

        setFeaturedProducts(normalizeProducts(Array.isArray(rawFeatured) ? rawFeatured : rawFeatured?.products || []));
        setBrands(normalizeBrands(Array.isArray(rawBrands) ? rawBrands : []));
        setAllProducts(normalizeProducts(Array.isArray(rawProducts) ? rawProducts : rawProducts?.products || []));

      } catch (err) {
        console.error("Lỗi hệ thống:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- XỬ LÝ KHI BẤM CHAT ---
  const handleOpenChat = (brand: Brand) => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để chat!");
        navigate("/login");
        return;
    }
    setActiveChatBrand(brand);
  };

  const sliderSettings = {
    slidesToShow: 5,
    slidesToScroll: 1,
    infinite: featuredProducts.length > 5,
    autoplay: true,
    autoplaySpeed: 3000,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 4 } },
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
    ],
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen animate-pulse">
        <div className="h-[400px] bg-gray-300 w-full"></div>
        <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-64 bg-gray-200 rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-20 font-sans text-gray-800 relative">
      
      {/* 1. HERO BANNER */}
      <section className="relative w-full h-[400px] lg:h-[500px]">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1470&auto=format&fit=crop"
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">SUMMER COLLECTION</h1>
          <p className="text-lg md:text-xl mb-8 font-light max-w-2xl drop-shadow">
            Đón đầu xu hướng thời trang quốc tế với mức giá ưu đãi nhất.
          </p>
          <a href="#featured" className="px-8 py-3 bg-white text-gray-900 font-bold rounded hover:bg-gray-100 transition shadow-lg uppercase tracking-wider text-sm">
            Khám phá ngay
          </a>
        </div>
      </section>

      {/* 2. POLICY BAR */}
      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <PolicyItem icon="🚚" title="Miễn phí vận chuyển" desc="Cho đơn từ 500k" />
                <PolicyItem icon="🛡️" title="Bảo hành chính hãng" desc="Cam kết 100%" />
                <PolicyItem icon="QK" title="Đổi trả 30 ngày" desc="Nếu có lỗi NSX" />
                <PolicyItem icon="💬" title="Hỗ trợ 24/7" desc="Hotline: 1900 xxxx" />
            </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 space-y-12 py-10">

        {/* 3. FLASH SALE / FEATURED */}
        {featuredProducts.length > 0 && (
          <section id="featured" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold text-red-600 uppercase">🔥 Sản Phẩm Hot</h2>
                 <span className="hidden md:inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">Kết thúc sớm</span>
              </div>
              <a href="/products" className="text-sm font-medium text-gray-500 hover:text-red-600 transition flex items-center">
                Xem tất cả <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </a>
            </div>

            <Slider {...sliderSettings} className="-mx-2">
              {featuredProducts.map((product) => (
                <div key={product._id} className="px-2 py-2">
                  <div className="border border-gray-100 rounded hover:border-red-300 hover:shadow-md transition-all h-full bg-white p-2">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </Slider>
          </section>
        )}

        {/* 4. BRANDS CAROUSEL */}
        {brands.length > 0 && (
          <section className="bg-white py-12 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-10">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">
                Đối tác chiến lược
              </h2>
              <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 px-6">
              {brands.map((brand) => (
                <div
                  key={brand._id}
                  className="group w-32 h-20 md:w-48 md:h-28 flex items-center justify-center bg-gray-50 rounded-xl border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden p-4"
                >
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain transform group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. BRAND SHOWCASE (WITH CHAT BUTTON) */}
        <div className="space-y-10">
          {brands.map((brand) => {
            const productsOfBrand = allProducts.filter(p => p.brandId === brand._id).slice(0, 5);
            
            if (productsOfBrand.length === 0) return null; 

            return (
              <section key={brand._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                
                {/* Brand Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded border border-gray-200 p-1 flex items-center justify-center">
                         <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain mix-blend-multiply"/>
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-gray-800">{brand.name} Official Store</h3>
                         <p className="text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> Verified Partner • {brand.country}
                         </p>
                      </div>
                   </div>
                   
                   {/* GROUP BUTTONS: CHAT & VIEW SHOP */}
                   <div className="flex items-center gap-3">
                       <button 
                         onClick={() => handleOpenChat(brand)} // Mở ChatBox
                         className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-all shadow-sm active:scale-95 group"
                       >
                         <MessageCircle className="w-4 h-4 group-hover:animate-bounce" />
                         <span>Chat ngay</span>
                       </button>

                       <a 
                         href={`/products?brand=${brand._id}`} 
                         className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all shadow-sm"
                       >
                         Xem Shop
                       </a>
                   </div>
                </div>

                {/* Product Grid */}
                <div className="p-4">
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {productsOfBrand.map((product) => (
                         <div key={product._id} className="group bg-white rounded border border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-300 p-2">
                            <ProductCard product={product} />
                         </div>
                      ))}
                   </div>
                </div>
              </section>
            );
          })}
        </div>

      </div>

      {/* --- RENDER CHAT BOX NẾU ĐANG ACTIVE --- */}
      {/* Khung chat sẽ hiện đè lên trên trang web ở góc phải */}
      {activeChatBrand && (
        <ChatBox 
            brand={activeChatBrand} 
            currentUser={currentUser} 
            onClose={() => setActiveChatBrand(null)} 
        />
      )}

    </div>
  );
};

export default Home;

// --- SUB-COMPONENTS ---
const PolicyItem = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex flex-col items-center justify-center gap-1">
        <span className="text-2xl mb-1">{icon}</span>
        <h4 className="font-bold text-sm text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500">{desc}</p>
    </div>
);

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button onClick={onClick} className="absolute top-1/2 -right-3 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition border border-gray-100">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button onClick={onClick} className="absolute top-1/2 -left-3 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition border border-gray-100">
      <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
  );
}