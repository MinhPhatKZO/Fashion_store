import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatBox from "../../components/Chatbox/ChatBox";
// 👇 IMPORT AIChatBox 👇
import AIChatBox from "../../components/Chatbox/AIChatBox"; 

// Import các component con
import HomeHero from "./components/HomeHero";
import HomePolicies from "./components/HomePolicies";
import HomeFlashSale from "./components/HomeFlashSale";
import HomeBrands from "./components/HomeBrands";
import HomeBrandStores from "./components/HomeBrandStores";
import RecommendationSection from "./components/RecommendationSection"; 

// Import Utils
import { 
    API_BASE_URL, 
    Product, 
    Brand, 
    getMongoId, 
    getImageUrl, 
    getBrandLogo 
} from "../../utils/homeUtils";

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // States cơ bản
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States cho Chat & AI
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [activeChatBrand, setActiveChatBrand] = useState<Brand | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false); // State quản lý ẩn/hiện AI Chatbot
  const [currentUser, setCurrentUser] = useState<{_id: string, name: string} | null>(null);

  // 1. Check Login
  useEffect(() => {
      const userId = localStorage.getItem("userId"); 
      const userName = localStorage.getItem("userName");
      const token = localStorage.getItem("token");
      if(token && userId && userName) setCurrentUser({ _id: userId, name: userName });
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const requests = [
          axios.get(`${API_BASE_URL}/api/products/featured`),
          axios.get(`${API_BASE_URL}/api/brands`),
          axios.get(`${API_BASE_URL}/api/products`),
        ];

        let aiRequestIndex = -1;
        if (token) {
          requests.push(axios.get(`${API_BASE_URL}/api/recommendations`, {
            headers: { Authorization: `Bearer ${token}` }
          }));
          aiRequestIndex = requests.length - 1;
        }

        const results = await Promise.allSettled(requests);

        const getData = (index: number) => {
           const res = results[index];
           return (res && res.status === 'fulfilled' && res.value) ? res.value.data : null;
        };

        const rawFeatured = getData(0);
        const rawBrands = getData(1);
        const rawProducts = getData(2);

        const normalizeProducts = (data: any): Product[] => {
          if (!data || !Array.isArray(data)) return [];
          return data.map((p: any) => ({
            ...p,
            _id: getMongoId(p._id),
            brandId: p.brandId ? getMongoId(p.brandId) : undefined,
            image: p.images && p.images.length > 0 ? getImageUrl(p.images[0].url) : getImageUrl(p.image),
          }));
        };

        const normalizeBrands = (data: any): Brand[] => {
          if (!data || !Array.isArray(data)) return [];
          return data.map((b: any) => ({
            ...b,
            _id: getMongoId(b._id),
            logoUrl: getBrandLogo(b.name), 
          }));
        };

        setFeaturedProducts(normalizeProducts(rawFeatured?.products || rawFeatured));
        setBrands(normalizeBrands(rawBrands));
        setAllProducts(normalizeProducts(rawProducts?.products || rawProducts));

        if (aiRequestIndex !== -1) {
            const rawAI = getData(aiRequestIndex);
            if (rawAI && rawAI.success) {
                setRecommendedProducts(normalizeProducts(rawAI.products));
            }
        }

      } catch (err) {
        console.error("Lỗi hệ thống:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mở Chat với Thương hiệu
  const handleOpenChat = (brand: Brand) => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để chat!");
        navigate("/login");
        return;
    }
    setActiveChatBrand(brand);
  };

  // Mở Chat với Trợ lý AI
  const handleOpenAIChat = () => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để trò chuyện với Trợ lý AI!");
        navigate("/login");
        return;
    }
    setIsAIChatOpen(true);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-slate-100 pb-24 relative overflow-hidden">
      
      {/* 🌟 WATERMARK */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[25vw] font-black text-gray-900 opacity-[0.08] tracking-tighter rotate-[-15deg] whitespace-nowrap uppercase">
          KZONE
        </h1>
      </div>

      <div className="max-w-[1450px] mx-auto px-4 lg:px-8 py-8 space-y-10 relative z-10">
        <HomeHero />
        <HomePolicies />
        
        {featuredProducts?.length > 0 && <HomeFlashSale products={featuredProducts} />}

        <RecommendationSection products={recommendedProducts} />
        
        {brands?.length > 0 && <HomeBrands brands={brands} />}
        
        {brands?.length > 0 && (
            <HomeBrandStores 
                brands={brands} 
                products={allProducts} 
                onChat={handleOpenChat} 
            />
        )}
      </div>

      {/* ========================================= */}
      {/* KHU VỰC CHAT & NÚT ROBOT ĐỘNG CỰC CHẤT    */}
      {/* ========================================= */}

      {/* 1. Nút gọi AI lơ lửng ở góc dưới (Sử dụng ảnh GIF Robot) */}
      {!isAIChatOpen && (
          <button
              onClick={handleOpenAIChat}
              className="fixed bottom-6 right-6 z-40 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.4)] flex items-center justify-center hover:scale-110 transition-transform duration-300 border-2 border-blue-50 hover:border-blue-300 group"
          >
              {/* Ảnh GIF Robot chuyển động */}
              <img 
                  src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f916/512.gif" 
                  alt="AI Robot" 
                  className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300"
              />
              
              {/* Dấu chấm đỏ báo hiệu chưa đọc (Đã căn chỉnh lại cho viền to hơn) */}
              <span className="absolute top-0 right-0 md:top-1 md:right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>

              {/* Tooltip hiển thị khi hover chuột vào */}
              <span className="absolute -top-12 right-0 md:-top-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs md:text-sm font-bold px-3 py-1.5 md:py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
                  Chat với AI ngay! ✨
                  {/* Mũi tên trỏ xuống của Tooltip */}
                  <svg className="absolute text-purple-600 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
              </span>
          </button>
      )}

      {/* 2. Khung Chat AI */}
      {isAIChatOpen && (
        <AIChatBox 
            brand={{ _id: "", name: "KZONE AI", logoUrl: "" } as Brand} 
            currentUser={currentUser} 
            onClose={() => setIsAIChatOpen(false)} 
        />
      )}

      {/* 3. Khung Chat của Thương hiệu cũ */}
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