import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatBox from "../../components/Chatbox/ChatBox";

// Import các component con
import HomeHero from "./components/HomeHero";
import HomePolicies from "./components/HomePolicies";
import HomeFlashSale from "./components/HomeFlashSale";
import HomeBrands from "./components/HomeBrands";
import HomeBrandStores from "./components/HomeBrandStores";
// 👇 BƯỚC QUAN TRỌNG: Import component Gợi ý AI mới 👇
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
  
  // States cho AI & Chat
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [activeChatBrand, setActiveChatBrand] = useState<Brand | null>(null);
  const [currentUser, setCurrentUser] = useState<{_id: string, name: string} | null>(null);

  // 1. Check Login
  useEffect(() => {
      const userId = localStorage.getItem("userId"); 
      const userName = localStorage.getItem("userName");
      const token = localStorage.getItem("token");
      if(token && userId && userName) setCurrentUser({ _id: userId, name: userName });
  }, []);

  // 2. Fetch Data (An toàn, không bị lỗi khi chưa đăng nhập)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Chuẩn bị danh sách API cần gọi
        const requests = [
          axios.get(`${API_BASE_URL}/api/products/featured`),
          axios.get(`${API_BASE_URL}/api/brands`),
          axios.get(`${API_BASE_URL}/api/products`),
        ];

        // Nếu đã đăng nhập thì mới gọi thêm API lấy gợi ý AI
        let aiRequestIndex = -1;
        if (token) {
          requests.push(axios.get(`${API_BASE_URL}/api/recommendations`, {
            headers: { Authorization: `Bearer ${token}` }
          }));
          aiRequestIndex = requests.length - 1; // Lưu lại vị trí của API AI
        }

        const results = await Promise.allSettled(requests);

        // Hàm bóc tách dữ liệu an toàn
        const getData = (index: number) => {
           const res = results[index];
           return (res && res.status === 'fulfilled' && res.value) ? res.value.data : null;
        };

        const rawFeatured = getData(0);
        const rawBrands = getData(1);
        const rawProducts = getData(2);

        // Chuẩn hóa dữ liệu
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

        // Xử lý riêng dữ liệu AI nếu có gọi API
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

  const handleOpenChat = (brand: Brand) => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để chat!");
        navigate("/login");
        return;
    }
    setActiveChatBrand(brand);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-slate-100 pb-24 relative overflow-hidden">
      
      {/* 🌟 WATERMARK KZONE HOÀN HẢO 🌟 */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[25vw] font-black text-gray-900 opacity-[0.08] tracking-tighter rotate-[-15deg] whitespace-nowrap uppercase">
          KZONE
        </h1>
      </div>

      <div className="max-w-[1450px] mx-auto px-4 lg:px-8 py-8 space-y-10 relative z-10">
        
        {/* Render các component con */}
        <HomeHero />
        <HomePolicies />
        
        {/* Đưa Flash Sale lên ngay dưới Banner và Policies */}
        {featuredProducts?.length > 0 && <HomeFlashSale products={featuredProducts} />}

        {/* 🤖 MỤC GỢI Ý AI ĐƯỢC ĐẨY XUỐNG DƯỚI FLASH SALE */}
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