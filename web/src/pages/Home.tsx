import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard/ProductCard";
import Slider from "react-slick";
import { MessageCircle, Truck, ShieldCheck, RefreshCcw, Headphones, Zap, Star } from "lucide-react";
import ChatBox from "../components/Chatbox/ChatBox";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- CẤU HÌNH ---
const API_BASE_URL = "http://localhost:5000";

const BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1470&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1470&auto=format&fit=crop",
];

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

// 👇 HÀM MỚI: LẤY MÀU CHỦ ĐẠO THEO THƯƠNG HIỆU
const getBrandTheme = (brandName: string) => {
    const name = brandName.toLowerCase().replace(/\s/g, "");
    
    // Định nghĩa màu cho từng thương hiệu
    const themes: { [key: string]: { border: string; hoverBg: string } } = {
        nike: { border: "border-t-slate-800", hoverBg: "hover:bg-slate-50" }, // Nike: Đen/Xám
        adidas: { border: "border-t-blue-600", hoverBg: "hover:bg-blue-50" }, // Adidas: Xanh dương
        zara: { border: "border-t-stone-600", hoverBg: "hover:bg-stone-50" }, // Zara: Màu đất/trầm
        "h&m": { border: "border-t-red-600", hoverBg: "hover:bg-red-50" }, // H&M: Đỏ
        hm: { border: "border-t-red-600", hoverBg: "hover:bg-red-50" },
        gucci: { border: "border-t-emerald-700", hoverBg: "hover:bg-emerald-50" }, // Gucci: Xanh lá đậm
        chanel: { border: "border-t-gray-900", hoverBg: "hover:bg-gray-50" },
        dior: { border: "border-t-rose-400", hoverBg: "hover:bg-rose-50" },
    };

    // Mặc định nếu không tìm thấy brand (Màu xanh lam nhẹ)
    return themes[name] || { border: "border-t-cyan-500", hoverBg: "hover:bg-cyan-50" };
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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeChatBrand, setActiveChatBrand] = useState<Brand | null>(null);
  const [currentUser, setCurrentUser] = useState<{_id: string, name: string} | null>(null);

  useEffect(() => {
      const userId = localStorage.getItem("userId"); 
      const userName = localStorage.getItem("userName");
      const token = localStorage.getItem("token");
      if(token && userId && userName) setCurrentUser({ _id: userId, name: userName });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % BANNER_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const handleOpenChat = (brand: Brand) => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để chat!");
        navigate("/login");
        return;
    }
    setActiveChatBrand(brand);
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 4 } },
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
    ],
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  // Cập nhật cardClassName chung (bỏ màu nền cố định ở đây để xử lý dynamic bên dưới)
  const cardBaseClass = "group rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm transition-all duration-500 ease-out hover:shadow-[0_0_30px_-5px_rgba(0,0,0,0.1)] hover:-translate-y-1 relative z-10 bg-white";

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-slate-100 pb-24">
      
      <div className="max-w-[1450px] mx-auto px-4 lg:px-8 py-8 space-y-10">
        
        {/* === SECTION 1: HERO BANNER === */}
        <section className={`${cardBaseClass} !p-3`}> 
            <div className="relative w-full h-[400px] lg:h-[500px] rounded-[1.5rem] overflow-hidden group/banner">
                {BANNER_IMAGES.map((imgUrl, index) => (
                    <div 
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                            index === currentBannerIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                        }`}
                    >
                        <img src={imgUrl} alt="Banner" className="w-full h-full object-cover transform group-hover/banner:scale-105 transition-transform duration-[2000ms]" />
                    </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-20 flex flex-col justify-center px-10 md:px-20 text-white">
                    <h1 className="text-4xl md:text-7xl font-extrabold mb-4 drop-shadow-lg max-w-2xl leading-tight animate-fade-in-up">
                        SUMMER <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">VIBES</span>
                    </h1>
                    <p className="text-lg md:text-xl mb-8 max-w-md opacity-90 drop-shadow-md">Bộ sưu tập mới nhất với ưu đãi lên đến 50%.</p>
                    <button onClick={() => document.getElementById('featured')?.scrollIntoView()} className="w-fit px-8 py-3.5 bg-white text-gray-900 font-bold rounded-full hover:bg-yellow-400 hover:text-black hover:shadow-lg hover:scale-105 transition-all shadow-md">
                        MUA NGAY
                    </button>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {BANNER_IMAGES.map((_, idx) => (
                        <button key={idx} onClick={() => setCurrentBannerIndex(idx)} className={`h-2.5 rounded-full transition-all shadow-sm ${idx === currentBannerIndex ? "w-10 bg-white" : "w-2.5 bg-white/50 hover:bg-white"}`} />
                    ))}
                </div>
            </div>
        </section>

        {/* === SECTION 2: CHÍNH SÁCH === */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
             <PolicyCard icon={<Truck size={32}/>} title="Miễn phí vận chuyển" sub="Đơn hàng > 500k" color="text-blue-500" bg="bg-blue-50" glow="hover:shadow-blue-100" />
             <PolicyCard icon={<ShieldCheck size={32}/>} title="Bảo hành chính hãng" sub="Cam kết 100%" color="text-green-500" bg="bg-green-50" glow="hover:shadow-green-100" />
             <PolicyCard icon={<RefreshCcw size={32}/>} title="Đổi trả 30 ngày" sub="Lỗi do NSX" color="text-orange-500" bg="bg-orange-50" glow="hover:shadow-orange-100" />
             <PolicyCard icon={<Headphones size={32}/>} title="Hỗ trợ 24/7" sub="Hotline: 1900 xxxx" color="text-purple-500" bg="bg-purple-50" glow="hover:shadow-purple-100" />
        </section>

        {/* === SECTION 3: FLASH SALE === */}
        {featuredProducts.length > 0 && (
          <section id="featured" className={`${cardBaseClass} border-l-4 border-l-red-500`}>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-2xl animate-pulse">
                            <Zap className="w-8 h-8 text-red-600 fill-red-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight italic">FLASH SALE</h2>
                            <p className="text-sm text-gray-500 font-medium">Săn deal hot nhất trong ngày</p>
                        </div>
                    </div>
                    <FlashSaleTimer />
                </div>
                <a href="/products" className="px-6 py-2.5 rounded-full bg-gray-50 text-gray-700 font-bold hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-gray-200">Xem tất cả</a>
             </div>
             
             <div className="bg-gradient-to-b from-red-50/50 to-transparent rounded-2xl p-4">
                <Slider {...sliderSettings} className="-mx-3">
                    {featuredProducts.map((product) => (
                    <div key={product._id} className="px-3 py-2 h-full">
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full border border-gray-100 overflow-hidden group/product">
                            <ProductCard product={product} />
                        </div>
                    </div>
                    ))}
                </Slider>
             </div>
          </section>
        )}

        {/* === SECTION 4: THƯƠNG HIỆU === */}
        {brands.length > 0 && (
            <section className={cardBaseClass}>
                <div className="text-center mb-8 relative">
                    <span className="absolute left-1/2 -translate-x-1/2 top-0 text-6xl opacity-5 font-black text-gray-900 uppercase tracking-widest whitespace-nowrap pointer-events-none">Brands Partner</span>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-widest flex items-center justify-center gap-3 relative z-10">
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400"/> Đối tác chiến lược <Star className="w-6 h-6 text-yellow-400 fill-yellow-400"/>
                    </h2>
                </div>
                <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                    {brands.map((brand) => (
                        <div key={brand._id} className="w-28 h-28 md:w-40 md:h-40 bg-white rounded-3xl flex items-center justify-center p-6 grayscale hover:grayscale-0 shadow-sm hover:shadow-[0_0_25px_rgba(0,0,0,0.1)] hover:scale-110 transition-all duration-300 border border-gray-100 cursor-pointer relative z-10">
                            <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* === SECTION 5: GIAN HÀNG CHÍNH HÃNG (ĐÃ SỬA MÀU NỀN HOVER) === */}
        <div className="space-y-10">
             {brands.map((brand) => {
                 const products = allProducts.filter(p => p.brandId === brand._id).slice(0, 5);
                 if (products.length === 0) return null;

                 // 👇 Lấy theme màu cho từng brand
                 const brandTheme = getBrandTheme(brand.name);

                 return (
                     <section 
                        key={brand._id} 
                        // 👇 Áp dụng class hoverBg và border động tại đây
                        className={`${cardBaseClass} p-0 overflow-hidden border-t-4 ${brandTheme.border} ${brandTheme.hoverBg}`}
                     >
                         <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-100/50 bg-transparent">
                             <div className="flex items-center gap-6">
                                 <div className="w-24 h-24 bg-white rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                                     <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain mix-blend-multiply"/>
                                 </div>
                                 <div>
                                     <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{brand.name} Store</h3>
                                     <div className="flex items-center gap-3 mt-2">
                                         <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Official Mall</span>
                                         <span className="text-gray-500 text-sm flex items-center gap-1"><ShieldCheck size={14}/> 100% Chính hãng</span>
                                         <span className="text-gray-400">•</span>
                                         <span className="text-gray-500 text-sm">{brand.country}</span>
                                     </div>
                                 </div>
                             </div>
                             <div className="flex gap-3 w-full md:w-auto">
                                 <button onClick={() => handleOpenChat(brand)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#78350F] text-white rounded-xl font-bold hover:bg-[#5a250b] hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                     <MessageCircle size={20}/> Chat ngay
                                 </button>
                                 <a href={`/products?brand=${brand._id}`} className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:border-gray-800 hover:text-gray-900 transition-all">
                                     Xem Shop
                                 </a>
                             </div>
                         </div>
                         <div className="p-6 md:p-8 bg-white/40">
                             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                                 {products.map(p => (
                                     <div key={p._id} className="bg-white rounded-2xl p-2 border border-gray-100 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                         <ProductCard product={p} />
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </section>
                 )
             })}
        </div>

      </div>

      {activeChatBrand && <ChatBox brand={activeChatBrand} currentUser={currentUser} onClose={() => setActiveChatBrand(null)} />}
    </div>
  );
};

export default Home;

// --- SUB COMPONENTS ---

const FlashSaleTimer = () => {
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const minutes = 59 - now.getMinutes();
            const seconds = 59 - now.getSeconds();
            setTimeLeft({ h: 0, m: minutes, s: seconds });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium text-sm uppercase tracking-wide hidden md:block">Kết thúc trong</span>
            <div className="flex gap-1.5 items-center">
                <TimeBox value={pad(timeLeft.h)} />
                <span className="font-bold text-red-600">:</span>
                <TimeBox value={pad(timeLeft.m)} />
                <span className="font-bold text-red-600">:</span>
                <TimeBox value={pad(timeLeft.s)} />
            </div>
        </div>
    );
};

const TimeBox = ({ value }: { value: string | number }) => (
    <div className="bg-red-600 text-white font-bold text-lg w-9 h-9 flex items-center justify-center rounded-lg shadow-sm">
        {value}
    </div>
);

const PolicyCard = ({ icon, title, sub, color, bg, glow }: any) => (
    <div className={`bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center gap-3 border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${glow} cursor-pointer group`}>
        <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">{sub}</p>
        </div>
    </div>
);

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button onClick={onClick} className="absolute top-1/2 -right-5 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm shadow-[0_5px_15px_rgba(0,0,0,0.1)] rounded-full flex items-center justify-center text-gray-800 hover:bg-black hover:text-white hover:scale-110 transition-all border border-gray-100 group">
      <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button onClick={onClick} className="absolute top-1/2 -left-5 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm shadow-[0_5px_15px_rgba(0,0,0,0.1)] rounded-full flex items-center justify-center text-gray-800 hover:bg-black hover:text-white hover:scale-110 transition-all border border-gray-100 group">
      <svg className="w-5 h-5 rotate-180 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
  );
}